import { assertEquals } from '../../src/dev_deps.ts';
import { testApi } from '../../dev_mod.ts';
import { Api, Route } from '../../mod.ts';
import plugin from './plugin.ts';

Deno.test('Healthcheck plugin', async () => {
  const route = new Route('GET', '/hello');

  const api = new Api({ port: 80 });
  api.addRoute(route);
  plugin(api);

  const result = await testApi(api).request('GET', { uri: '/healthz' });

  assertEquals(result.statusCode, 200);
});
