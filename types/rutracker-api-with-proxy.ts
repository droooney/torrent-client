declare module 'rutracker-api-with-proxy' {
  import { ReadStream } from 'node:fs';

  import { AxiosRequestConfig } from 'axios';

  export class Torrent {
    id: string;
    title: string;
    author: string;
    size: number;
    seeds: number;
  }

  export interface LoginOptions {
    username: string;
    password: string;
  }

  export interface SearchOptions {
    query: string;
    sort?: 'seeds';
    order?: 'asc' | 'desc';
  }

  class RutrackerApi {
    constructor(host?: string, config?: AxiosRequestConfig);
    login(options: LoginOptions): Promise<unknown>;
    search(options: SearchOptions): Promise<Torrent[]>;
    download(torrentId: string): Promise<ReadStream>;
  }

  export default RutrackerApi;
}
