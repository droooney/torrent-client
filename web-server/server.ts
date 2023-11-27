import http from 'http';
import Application from 'koa';

import { Context, State } from 'web-server/types/koa';

export const app = new Application<State, Context>();

export const server = http.createServer(app.callback());
