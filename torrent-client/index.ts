import path from 'node:path';

import { Prisma, Torrent, TorrentClientState } from '@prisma/client';
import fs from 'fs-extra';
import { ParseTorrent } from 'parse-torrent';
import { Torrent as ClientTorrent, Instance } from 'webtorrent';

import prisma from 'db/prisma';

import CustomError from 'utilities/CustomError';
import { minmax } from 'utilities/number';

interface AddFileTorrent {
  type: 'file';
  path: string;
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

const UPDATE_DB_TORRENT_INTERVAL = 1000;

class TorrentClient {
  private static getTorrentProgress(torrent: ClientTorrent): number {
    return minmax(torrent.progress, 0, torrent.length);
  }

  private resolveClient?: (client: Instance) => unknown;
  private resolveParseTorrent?: (parseTorrent: ParseTorrent) => unknown;

  clientPromise = new Promise<Instance>((resolve) => {
    this.resolveClient = resolve;
  });
  parseTorrentPromise = new Promise<ParseTorrent>((resolve) => {
    this.resolveParseTorrent = resolve;
  });

  constructor() {
    this.init();
  }

  async addTorrent(addTorrent: AddTorrent): Promise<Torrent> {
    const parseTorrent = await this.parseTorrentPromise;

    // important: await is needed, types are wrong
    const parsed = await parseTorrent(
      addTorrent.type === 'file' ? await fs.readFile(addTorrent.path) : addTorrent.magnet,
    );

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
        name: String(parsed.name ?? 'Неизвестно'),
        state: 'Pending',
        progress: 0,
        magnetUri: addTorrent.type === 'magnet' ? addTorrent.magnet : null,
        torrentPath: addTorrent.type === 'file' ? addTorrent.path : null,
      },
    });

    await this.switchTorrentsIfNeeded();

    return torrent;
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
          // TODO: add verifying state, update verified progress if verifying

          const progress = TorrentClient.getTorrentProgress(clientTorrent);

          if (!Number.isNaN(progress)) {
            await prisma.torrent.update({
              where: {
                infoHash: clientTorrent.infoHash,
              },
              data: {
                progress,
              },
            });
          }
        }),
      );
    }, UPDATE_DB_TORRENT_INTERVAL);

    if (await this.isPaused()) {
      await this.pauseClient();
    }

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

  async pauseTorrent(torrent: ClientTorrent): Promise<void> {
    await prisma.torrent.update({
      where: {
        infoHash: torrent.infoHash,
      },
      data: {
        state: 'Paused',
      },
    });

    torrent.destroy();

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
        state: 'Downloading',
      },
    });

    await Promise.all(
      activeTorrents.map(async (activeTorrent) => {
        await this.startTorrent(activeTorrent);
      }),
    );
  }

  private async startTorrent(torrent: Torrent): Promise<void> {
    const client = await this.clientPromise;

    const addTorrent = torrent.magnetUri ?? torrent.torrentPath;

    if (!addTorrent) {
      throw new CustomError('Ошибка добавления торрента');
    }

    const clientTorrent = client.add(addTorrent, {
      path: path.resolve(__dirname, 'downloads'),
      storeCacheSlots: 0,
    });

    clientTorrent.on('error', (err) => {
      console.log('torrent error', err);
    });

    clientTorrent.on('metadata', async () => {
      await prisma.torrent.update({
        where: {
          infoHash: torrent.infoHash,
        },
        data: {
          name: clientTorrent.name,
        },
      });
    });

    clientTorrent.on('ready', () => {
      clientTorrent.resume();
    });

    clientTorrent.on('done', async () => {
      clientTorrent.destroy();

      await prisma.torrent.update({
        where: {
          infoHash: torrent.infoHash,
        },
        data: {
          state: 'Finished',
          progress: 1,
        },
      });

      await this.switchTorrentsIfNeeded();
    });

    await prisma.torrent.update({
      where: {
        infoHash: torrent.infoHash,
      },
      data: {
        state: 'Downloading',
      },
    });
  }

  private async switchTorrentsIfNeeded(): Promise<void> {
    const state = await this.getState();

    const [activeTorrents, criticalTorrent] = await Promise.all([
      prisma.torrent.findMany({
        where: {
          state: 'Downloading',
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

    if (criticalTorrent) {
      if (criticalTorrent.state !== 'Downloading') {
        newActiveTorrent = criticalTorrent;
      }
    } else if (!activeTorrents.length) {
      newActiveTorrent = await prisma.torrent.findFirst({
        where: {
          state: 'Pending',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }

    if (!newActiveTorrent) {
      return;
    }

    const client = await this.clientPromise;

    await Promise.all(
      activeTorrents.map(async (activeTorrent) => {
        await prisma.torrent.update({
          where: {
            infoHash: activeTorrent.infoHash,
          },
          data: {
            state: 'Pending',
          },
        });

        client.torrents.find(({ infoHash }) => infoHash === activeTorrent.infoHash)?.destroy();
      }),
    );

    await this.startTorrent(newActiveTorrent);
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

  async updateState(data: Prisma.TorrentClientStateUpdateArgs['data']): Promise<void> {
    await prisma.torrentClientState.upsert({
      where: MAIN_STATE_WHERE,
      create: MAIN_STATE_CREATE,
      update: data,
    });
  }
}

const client = new TorrentClient();

export default client;
