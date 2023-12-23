import path from 'node:path';

import { Torrent, TorrentClientState, TorrentState } from '@prisma/client';
import fs from 'fs-extra';
import { ParseTorrent } from 'parse-torrent';
import { Torrent as ClientTorrent, Instance } from 'webtorrent';

import { TORRENTS_DIRECTORY } from 'constants/paths';

import prisma from 'db/prisma';

import CustomError from 'utilities/CustomError';
import { getProgress } from 'utilities/size';

interface AddFileTorrent {
  type: 'file';
  content: Buffer;
}

interface AddMagnetTorrent {
  type: 'magnet';
  magnet: string;
}

type AddTorrent = AddFileTorrent | AddMagnetTorrent;

const MAIN_STATE_ID = 'main';
const MAIN_STATE_WHERE = {
  id: MAIN_STATE_ID,
};
const MAIN_STATE_CREATE = {
  id: MAIN_STATE_ID,
  paused: false,
};
const ACTIVE_TORRENT_STATES: TorrentState[] = ['Verifying', 'Downloading'];

const UPDATE_DB_TORRENT_INTERVAL = 5000;

class TorrentClient {
  private resolveClient?: (client: Instance) => unknown;
  private resolveParseTorrent?: (parseTorrent: ParseTorrent) => unknown;

  private clientPromise = new Promise<Instance>((resolve) => {
    this.resolveClient = resolve;
  });
  private parseTorrentPromise = new Promise<ParseTorrent>((resolve) => {
    this.resolveParseTorrent = resolve;
  });

  constructor() {
    this.init();
  }

  async addTorrent(addTorrent: AddTorrent): Promise<Torrent> {
    const parseTorrent = await this.parseTorrentPromise;

    // important: await is needed, types are wrong
    const parsed =
      addTorrent.type === 'file' ? await parseTorrent(addTorrent.content) : await parseTorrent(addTorrent.magnet);

    if (!parsed.infoHash) {
      throw new Error('Ошибка добавления торрента');
    }

    let torrent = await prisma.torrent.findFirst({
      where: {
        infoHash: parsed.infoHash,
      },
    });

    if (torrent) {
      throw new CustomError('Торрент уже добавлен');
    }

    torrent = await prisma.torrent.create({
      data: {
        infoHash: parsed.infoHash,
        name: typeof parsed.name === 'string' ? parsed.name : null,
        state: 'Queued',
        size: 'length' in parsed ? parsed.length ?? 0 : 0,
        progress: 0,
        magnetUri: addTorrent.type === 'magnet' ? addTorrent.magnet : null,
        torrentFile: addTorrent.type === 'file' ? addTorrent.content : null,
      },
    });

    const newActiveTorrent = await this.switchTorrentsIfNeeded();

    return newActiveTorrent?.infoHash === torrent.infoHash ? newActiveTorrent : torrent;
  }

  async deleteTorrent(infoHash: string): Promise<void> {
    await this.destroyClientTorrent(infoHash);

    const torrent = await prisma.torrent.findUnique({
      where: {
        infoHash,
      },
    });

    if (torrent?.name) {
      await fs.remove(path.resolve(TORRENTS_DIRECTORY, torrent.name));
    }

    await prisma.torrent.delete({
      where: {
        infoHash,
      },
    });

    await this.switchTorrentsIfNeeded();
  }

  async destroyClientTorrent(infoHash: string): Promise<void> {
    (await this.getClientTorrent(infoHash))?.destroy();
  }

  async getClientTorrent(infoHash: string): Promise<ClientTorrent | null> {
    const client = await this.clientPromise;

    return client.torrents.find((clientTorrent) => infoHash === clientTorrent.infoHash) ?? null;
  }

  async getDownloadSpeed(): Promise<number> {
    return (await this.clientPromise).downloadSpeed;
  }

  async getUploadSpeed(): Promise<number> {
    return (await this.clientPromise).uploadSpeed;
  }

  async getState(): Promise<TorrentClientState> {
    return prisma.torrentClientState.upsert({
      where: MAIN_STATE_WHERE,
      create: MAIN_STATE_CREATE,
      update: {},
    });
  }

  async init(): Promise<void> {
    const [{ default: WebTorrent }, { default: parseTorrent }] = await Promise.all([
      import('webtorrent'),
      import('parse-torrent'),
    ]);

    const client = new WebTorrent();

    client.on('error', (err) => {
      console.log('client error', err);
    });

    this.resolveClient?.(client);
    this.resolveParseTorrent?.(parseTorrent);

    setInterval(async () => {
      if (await this.isPaused()) {
        return;
      }

      await Promise.all(
        client.torrents.map(async (clientTorrent) => {
          const torrent = await prisma.torrent.findUnique({
            where: {
              infoHash: clientTorrent.infoHash,
            },
          });

          if (torrent?.state !== 'Downloading') {
            return;
          }

          await this.writeProgressToDatabase(clientTorrent);
        }),
      );
    }, UPDATE_DB_TORRENT_INTERVAL);

    const { paused, downloadSpeedLimit, uploadSpeedLimit } = await this.getState();

    if (paused) {
      await this.pauseClient();
    } else {
      await Promise.all([this.throttleDownload(downloadSpeedLimit), this.throttleUpload(uploadSpeedLimit)]);
    }

    await this.queueErrorTorrents();
    await this.startActiveTorrents();
    await this.switchTorrentsIfNeeded();
  }

  async isPaused(): Promise<boolean> {
    return (await this.getState()).paused;
  }

  async pause(): Promise<boolean> {
    if (await this.isPaused()) {
      return false;
    }

    await this.updateState({
      paused: true,
    });

    await this.pauseClient();

    return true;
  }

  private async pauseClient(): Promise<void> {
    await Promise.all([this.throttleDownload(0), this.throttleUpload(0)]);
  }

  async pauseTorrent(infoHash: string): Promise<void> {
    const torrent = await prisma.torrent.findUnique({
      where: {
        infoHash,
        state: {
          in: ['Downloading', 'Verifying', 'Queued'],
        },
      },
    });

    if (!torrent) {
      return;
    }

    const clientTorrent = await this.getClientTorrent(infoHash);

    if (torrent.state === 'Downloading') {
      await this.writeProgressToDatabase(clientTorrent);
    }

    await this.destroyClientTorrent(infoHash);

    await prisma.torrent.update({
      where: {
        infoHash,
      },
      data: {
        state: 'Paused',
      },
    });

    await this.switchTorrentsIfNeeded();
  }

  private async queueErrorTorrents(): Promise<void> {
    await prisma.torrent.updateMany({
      where: {
        state: 'Error',
      },
      data: {
        state: 'Queued',
        errorMessage: null,
      },
    });
  }

  async setCriticalTorrent(infoHash: string, critical: boolean): Promise<void> {
    const torrent = await prisma.torrent.findUnique({
      where: {
        infoHash,
        state: {
          not: 'Finished',
        },
      },
    });

    if (!torrent) {
      return;
    }

    if (critical) {
      await this.updateState({
        criticalTorrentId: infoHash,
      });
    } else {
      const { criticalTorrentId } = await this.getState();

      if (criticalTorrentId === infoHash) {
        await this.updateState({
          criticalTorrentId: null,
        });
      }
    }

    await this.switchTorrentsIfNeeded();
  }

  async setDownloadSpeedLimit(limit: number | null): Promise<void> {
    await this.updateState({
      downloadSpeedLimit: limit,
    });

    await this.throttleDownload(limit);
  }

  async setUploadSpeedLimit(limit: number | null): Promise<void> {
    await this.updateState({
      uploadSpeedLimit: limit,
    });

    await this.throttleUpload(limit);
  }

  private async startActiveTorrents(): Promise<void> {
    const activeTorrents = await prisma.torrent.findMany({
      where: {
        state: {
          in: ACTIVE_TORRENT_STATES,
        },
      },
    });

    await Promise.all(
      activeTorrents.map(async (activeTorrent) => {
        await this.startTorrent(activeTorrent);
      }),
    );
  }

  private async startTorrent(torrent: Torrent): Promise<Torrent> {
    const client = await this.clientPromise;

    const addTorrent = torrent.magnetUri ?? torrent.torrentFile;

    if (!addTorrent) {
      throw new CustomError('Ошибка добавления торрента');
    }

    torrent = await prisma.torrent.update({
      where: {
        infoHash: torrent.infoHash,
      },
      data: {
        state: 'Verifying',
      },
    });

    const clientTorrent = client.add(addTorrent, {
      path: TORRENTS_DIRECTORY,
      storeCacheSlots: 0,
    });

    clientTorrent.once('ready', async () => {
      await Promise.all([
        prisma.torrent.update({
          where: {
            infoHash: torrent.infoHash,
          },
          data: {
            name: clientTorrent.name,
            size: clientTorrent.length,
          },
        }),
        ...clientTorrent.files.map((file) =>
          prisma.torrentFile.upsert({
            where: {
              path: file.path,
            },
            create: {
              torrentId: torrent.infoHash,
              path: file.path,
              state: 'Progress',
              size: file.length,
              progress: 0,
            },
            update: {},
          }),
        ),
      ]);
    });

    clientTorrent.once('error', async (err) => {
      console.log('torrent error', err);

      await prisma.torrent.update({
        where: {
          infoHash: torrent.infoHash,
        },
        data: {
          state: 'Error',
          errorMessage: err instanceof Error ? err.stack : String(err),
        },
      });

      await this.switchTorrentsIfNeeded();
    });

    clientTorrent.once('download', async () => {
      await prisma.torrent.update({
        where: {
          infoHash: torrent.infoHash,
          state: 'Verifying',
        },
        data: {
          state: 'Downloading',
        },
      });
    });

    clientTorrent.once('done', async () => {
      const filePaths = clientTorrent.files.map(({ path }) => path);

      clientTorrent.destroy();

      await Promise.all([
        (async () => {
          const state = await this.getState();

          if (state.criticalTorrentId === torrent.infoHash) {
            await this.updateState({
              criticalTorrentId: null,
            });
          }
        })(),
        prisma.torrent.update({
          where: {
            infoHash: torrent.infoHash,
          },
          data: {
            state: 'Finished',
            progress: 1,
          },
        }),
        ...filePaths.map((filePath) =>
          prisma.torrentFile.update({
            where: {
              path: filePath,
            },
            data: {
              state: 'Finished',
              progress: 1,
            },
          }),
        ),
      ]);

      await this.switchTorrentsIfNeeded();
    });

    return torrent;
  }

  private async switchTorrentsIfNeeded(): Promise<Torrent | null> {
    const state = await this.getState();

    const [activeTorrents, criticalTorrent] = await Promise.all([
      prisma.torrent.findMany({
        where: {
          state: {
            in: ACTIVE_TORRENT_STATES,
          },
        },
      }),
      state.criticalTorrentId
        ? prisma.torrent.findUnique({
            where: {
              infoHash: state.criticalTorrentId,
            },
          })
        : null,
    ]);

    let newActiveTorrent: Torrent | null = null;

    if (criticalTorrent?.state === 'Queued') {
      newActiveTorrent = criticalTorrent;
    } else if (!activeTorrents.length) {
      newActiveTorrent = await prisma.torrent.findFirst({
        where: {
          state: 'Queued',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }

    if (!newActiveTorrent) {
      return null;
    }

    await Promise.all(
      activeTorrents.map(async (activeTorrent) => {
        if (activeTorrent.state === 'Downloading') {
          await this.writeProgressToDatabase(await this.getClientTorrent(activeTorrent.infoHash));
        }

        await this.destroyClientTorrent(activeTorrent.infoHash);

        await prisma.torrent.update({
          where: {
            infoHash: activeTorrent.infoHash,
          },
          data: {
            state: 'Queued',
          },
        });
      }),
    );

    newActiveTorrent = await this.startTorrent(newActiveTorrent);

    return newActiveTorrent;
  }

  private async throttleDownload(limit: number | null): Promise<void> {
    const client = await this.clientPromise;

    // @ts-ignore
    client.throttleDownload(limit ?? -1);
  }

  private async throttleUpload(limit: number | null): Promise<void> {
    const client = await this.clientPromise;

    // @ts-ignore
    client.throttleUpload(limit ?? -1);
  }

  async unpause(): Promise<boolean> {
    if (!(await this.isPaused())) {
      return false;
    }

    await this.updateState({
      paused: false,
    });

    const { downloadSpeedLimit, uploadSpeedLimit } = await this.getState();

    await Promise.all([this.throttleDownload(downloadSpeedLimit), this.throttleUpload(uploadSpeedLimit)]);

    return true;
  }

  async unpauseTorrent(infoHash?: string): Promise<void> {
    await prisma.torrent.update({
      where: {
        infoHash,
        state: {
          in: ['Paused', 'Error'],
        },
      },
      data: {
        state: 'Queued',
        errorMessage: null,
      },
    });

    await this.switchTorrentsIfNeeded();
  }

  async updateState(data: Partial<TorrentClientState>): Promise<void> {
    await prisma.torrentClientState.upsert({
      where: MAIN_STATE_WHERE,
      create: {
        ...MAIN_STATE_CREATE,
        ...data,
      },
      update: data,
    });
  }

  async writeProgressToDatabase(clientTorrent: ClientTorrent | null): Promise<void> {
    if (!clientTorrent) {
      return;
    }

    const progress = getProgress(clientTorrent);

    await Promise.all([
      !Number.isNaN(progress) &&
        prisma.torrent.update({
          where: {
            infoHash: clientTorrent.infoHash,
          },
          data: {
            progress,
          },
        }),
      ...clientTorrent.files.map(async (file) => {
        const progress = getProgress(file);

        if (!Number.isNaN(progress)) {
          await prisma.torrentFile.update({
            where: {
              path: file.path,
            },
            data: {
              state: progress === 1 ? 'Finished' : undefined,
              progress,
            },
          });
        }
      }),
    ]);
  }
}

export default TorrentClient;
