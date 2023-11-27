import path from 'node:path';

import send from 'koa-send';

import { Middleware } from 'web-server/types/koa';

const INDEX_HTML_PATH = path.resolve('./build/index.html');

const render: Middleware<string> = async (ctx) => {
  await send(ctx, INDEX_HTML_PATH, { root: '/' });
};

export default render;
