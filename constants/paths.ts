import path from 'node:path';

if (!process.env.TORRENTS_DIRECTORY) {
  console.error('No torrents directory');

  process.exit(1);
}

export const ASSETS_DIRECTORY = path.resolve('./assets-storage');
export const DOWNLOADS_DIRECTORY = path.resolve(ASSETS_DIRECTORY, 'downloads');
export const TORRENTS_DIRECTORY = path.resolve(process.env.TORRENTS_DIRECTORY);
