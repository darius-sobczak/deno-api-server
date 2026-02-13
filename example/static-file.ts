/**
 * example how your can serve static files for deno api server
 */
import { Api, EMethod, IServerConfig, Route } from '../mod.ts';
import filePipe from '../src/presets/pipes/process/file.pipe.ts';

const serverConfig: IServerConfig = { port: 8080 };
const api = new Api(serverConfig);

api
  .addRoute(
    new Route(
      EMethod.GET,
      new URLPattern({ pathname: '/public/:file' }),
    )
      .addPipe((ctx) => {
        const filePath = ctx.match.params.file as string;
        return filePipe(`/app/example/public/${filePath}`)(ctx);
      }),
  )
  .addRoute(
    new Route(
      EMethod.GET,
      new URLPattern({ pathname: '/process/:file' }),
    )
      .addPipe((ctx) => {
        const filePath = ctx.match.params.file as string;
        return filePipe(`/app/example/public/${filePath}`, {
          noThrow: true,
        })(ctx);
      })
      .addPipe(({ state }) => {
        console.log(state.get('fileError'));
      })
      .addPipe(
        filePipe(`/app/example/not-found.jpg`, { contentType: 'image/jpg' }),
      ),
  );

// start listen
console.log(`Start server localhost:${api.serverConfig.port}`);
await api.listen();
