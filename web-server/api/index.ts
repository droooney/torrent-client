import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';

import serviceRouter from 'web-server/api/service';

import { API_ROOT } from 'web-server/types/api';
import { Context, State } from 'web-server/types/koa';

const apiRouter = new Router<State, Context>({
  prefix: API_ROOT,
});

apiRouter.use(bodyParser());

[serviceRouter].forEach((router) => {
  apiRouter.use(`/${router.apiType}`, router.koaRouter.routes(), router.koaRouter.allowedMethods());
});

export default apiRouter;
