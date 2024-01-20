import aliceClient from 'alice-client/client';

import ApiRouter from 'web-server/utilities/ApiRouter';

export default new ApiRouter('alice', {
  async request(_state, request) {
    // TODO: validate request

    // @ts-ignore
    return await aliceClient.handleRequest(request);
  },
});
