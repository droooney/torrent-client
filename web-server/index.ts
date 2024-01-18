import { blue, green } from 'colors/safe';
import { Middleware } from 'koa';
import connect from 'koa-connect';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

import { runMain } from 'utilities/process';

import api from 'web-server/api';
import render from 'web-server/middlewares/render';
import serve from 'web-server/middlewares/serve';
import { app, server } from 'web-server/server';

import webpackConfig from '../webpack.config';

const PORT = Number(process.env.PORT);

app.use(serve('/public'));
app.use(serve('/build'));

// if (process.env.NODE_ENV !== 'production') {
//   const compiler = webpack(webpackConfig);
//
//   app.use(
//     connect(
//       webpackDevMiddleware(compiler, {
//         writeToDisk: true,
//       }),
//     ),
//   );
// }

app.use(api.routes() as Middleware);
app.use(api.allowedMethods() as Middleware);
app.use(render);

console.log(blue('Web server started'));

runMain(async () => {
  await new Promise<void>((resolve) => {
    server.listen(PORT, resolve);
  });

  console.log(green(`Web server listening on http://localhost:${PORT}...`));
});
