import { blue, green } from 'colors/safe';
import connect from 'koa-connect';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

import render from 'web-server/middlewares/render';
import serve from 'web-server/middlewares/serve';
import { app, server } from 'web-server/server';

import webpackConfig from '../webpack.config';

const PORT = Number(process.env.PORT);

app.use(serve('/public'));
app.use(serve('/build'));

if (process.env.NODE_ENV !== 'production') {
  const compiler = webpack(webpackConfig);

  app.use(
    connect(
      webpackDevMiddleware(compiler, {
        writeToDisk: true,
      }),
    ),
  );
}

app.use(render);

console.log(blue('Web server started'));

(async () => {
  await new Promise<void>((resolve) => {
    server.listen(PORT, resolve);
  });

  console.log(green(`Web server listening on http://localhost:${PORT}...`));
})().catch((err) => {
  console.log(err);

  process.exit(1);
});
