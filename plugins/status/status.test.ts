import { testApi } from '../../dev_mod.ts';
import { Api, Route } from '../../mod.ts';
import plugin from './plugin.ts';

Deno.test('Status plugin', async () => {
  const route = new Route('GET', '/hello');

  const api = new Api({ port: 80 });
  api.addRoute(route);
  plugin(api);

  await testApi(api).request('GET', { uri: '/hello' });
});
