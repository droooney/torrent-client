import { ApiMethodsSchema } from 'web-server/types/api';

const service = {
  stop: {
    method: 'post',
  },
} as const satisfies ApiMethodsSchema;

export default service;
