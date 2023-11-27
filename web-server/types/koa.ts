import { Middleware as KoaMiddleware, ParameterizedContext } from 'koa';

export interface State {}

export type Context<Body = unknown> = ParameterizedContext<State, object, Body>;

export type Middleware<Body = unknown> = KoaMiddleware<State, Context<Body>, Body>;

export type Query<Payload extends object> = {
  [K in keyof Payload]?: string | string[];
};
