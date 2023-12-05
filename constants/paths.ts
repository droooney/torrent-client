import path from 'node:path';

export const ASSETS_DIRECTORY = path.resolve('./assets-storage');
export const DOWNLOADS_DIRECTORY = path.resolve(ASSETS_DIRECTORY, 'downloads');
export const TORRENTS_DIRECTORY = path.resolve(ASSETS_DIRECTORY, 'torrents');
