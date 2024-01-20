import { z } from 'zod';

import alice from 'web-server/types/api/alice';
import github from 'web-server/types/api/github';
import service from 'web-server/types/api/service';

export type Api = typeof api;

export type ApiType = string & keyof typeof api;

export type ApiMethodType<Type extends ApiType> = string & keyof Api[Type];

export type ApiMethodsSchema = {
  [Path in string]: {
    method: 'get' | 'post';
    request?: z.ZodObject<any>;
    response?: z.ZodObject<any>;
  };
};

export type ApiMethodDescription<Type extends ApiType, MethodType extends ApiMethodType<Type>> = Api[Type][MethodType];

export type ApiMethodRequest<Type extends ApiType, MethodType extends ApiMethodType<Type>> = ApiMethodDescription<
  Type,
  MethodType
> extends { request: z.ZodObject<any> }
  ? z.infer<ApiMethodDescription<Type, MethodType>['request']>
  : void;

export type ApiMethodResponse<Type extends ApiType, MethodType extends ApiMethodType<Type>> = ApiMethodDescription<
  Type,
  MethodType
> extends { response: z.ZodObject<any> }
  ? z.infer<ApiMethodDescription<Type, MethodType>['response']>
  : void;

export const API_ROOT = '/api';

const api = {
  alice,
  github,
  service,
};

export default api;
