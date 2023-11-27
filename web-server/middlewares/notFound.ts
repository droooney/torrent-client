import { NotFound } from 'http-errors';

import { Middleware } from 'web-server/types/koa';

const notFound: Middleware = async () => {
  throw NotFound();
};

export default notFound;
