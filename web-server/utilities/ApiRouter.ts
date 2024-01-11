import Router from '@koa/router';
import { BadRequest, InternalServerError, isHttpError } from 'http-errors';
import forEach from 'lodash/forEach';
import { z } from 'zod';

import { MaybePromise } from 'types/common';
import api, { ApiMethodRequest, ApiMethodResponse, ApiMethodType, ApiType } from 'web-server/types/api';
import { Context, State } from 'web-server/types/koa';

import { prepareErrorForLogging } from 'utilities/error';

export type ApiHandler<Type extends ApiType, MethodType extends ApiMethodType<Type>> = (
  state: State,
  request: ApiMethodRequest<Type, MethodType>,
  ctx: Context,
) => MaybePromise<ApiMethodResponse<Type, MethodType>>;

export type ApiHandlers<Type extends ApiType> = {
  [MethodType in ApiMethodType<Type>]: ApiHandler<Type, MethodType>;
};

export default class ApiRouter<Type extends ApiType> {
  apiType: Type;
  koaRouter: Router<State, Context>;

  constructor(apiType: Type, handlers: ApiHandlers<Type>) {
    this.apiType = apiType;
    this.koaRouter = new Router();

    forEach(api[this.apiType], (methodDescription, method) => {
      if (
        typeof methodDescription !== 'object' ||
        !methodDescription ||
        !('method' in methodDescription) ||
        (methodDescription.method !== 'get' && methodDescription.method !== 'post')
      ) {
        return;
      }

      const schema =
        'request' in methodDescription && methodDescription.request instanceof z.ZodType && methodDescription.request;

      this.koaRouter[methodDescription.method](`/${method}`, async (ctx) => {
        try {
          let request: ApiMethodRequest<Type, ApiMethodType<Type>> | undefined;

          if (schema) {
            const result = schema.safeParse(ctx.request.body);

            if (!result.success) {
              throw new BadRequest();
            }

            request = result.data;
          }

          ctx.body = await handlers[method as ApiMethodType<Type>](ctx.state, request as any, ctx);
          ctx.status = 200;
        } catch (err) {
          console.log(prepareErrorForLogging(err));

          const httpError = isHttpError(err) ? err : new InternalServerError();

          ctx.status = httpError.status;
          ctx.body = httpError.message;
        }
      });
    });
  }
}
