import ApiRouter from 'web-server/utilities/ApiRouter';

export default new ApiRouter('service', {
  async stop(_state, _request, ctx) {
    ctx.res.on('finish', () => {
      process.exit(0);
    });
  },
});
