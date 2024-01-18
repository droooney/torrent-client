import { z } from 'zod';

import { ApiMethodsSchema } from 'web-server/types/api';

const alice = {
  request: {
    method: 'post',
    request: z.object({}).passthrough(),
    response: z.object({}),
  },
} as const satisfies ApiMethodsSchema;

export default alice;
