import githubClient from 'github-client/client';

import { prepareErrorForLogging } from 'utilities/error';
import ApiRouter from 'web-server/utilities/ApiRouter';

export default new ApiRouter('github', {
  async webhooks(_state, request, ctx) {
    try {
      await githubClient.webhooks.verifyAndReceive({
        id: String(ctx.headers['x-github-delivery']),
        // @ts-ignore
        name: String(ctx.headers['x-github-event']),
        payload: JSON.stringify(request),
        signature: String(ctx.headers['x-hub-signature-256']),
      });
    } catch (err) {
      console.log(prepareErrorForLogging(err));
    }

    return {};
  },
});
