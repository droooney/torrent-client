import path from 'node:path';

import { Torrent } from '@prisma/client';
import fs from 'fs-extra';
import { HttpsProxyAgent } from 'https-proxy-agent';
import RutrackerApi, { Torrent as RutrackerTorrent } from 'rutracker-api-with-proxy';

import { DOWNLOADS_DIRECTORY } from 'constants/paths';

import { loadTorrentFromFile } from 'telegram-bot/utilities/documents';

const { PROXY_HOST: proxyHost, RUTRACKER_LOGIN: username, RUTRACKER_PASSWORD: password } = process.env;

class RutrackerClient {
  private api = new RutrackerApi(undefined, {
    httpsAgent: proxyHost ? new HttpsProxyAgent(proxyHost) : undefined,
  });
  private loginPromise = (async () => {
    if (!username || !password) {
      throw new Error('No rutracker auth');
    }

    await this.api.login({
      username,
      password,
    });
  })();

  async addTorrent(torrentId: string): Promise<Torrent | null> {
    const stream = await this.api.download(torrentId);
    const filePath = path.resolve(DOWNLOADS_DIRECTORY, `rutracker-${torrentId}.torrent`);
    const writeStream = fs.createWriteStream(filePath);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);

      stream.pipe(writeStream);
    });

    return loadTorrentFromFile(filePath);
  }

  async search(query: string): Promise<RutrackerTorrent[]> {
    await this.loginPromise;

    return this.api.search({
      query,
      sort: 'seeds',
      order: 'desc',
    });
  }
}

export default new RutrackerClient();
