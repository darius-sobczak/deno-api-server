import { assertCalledCount, assertCalledWithAt } from '../../src/dev_deps.ts';
import { mockFn, testApi } from '../../dev_mod.ts';
import { Api, Route } from '../../mod.ts';
import plugin from './plugin.ts';

Deno.test('Access log plugin', async () => {
  const route = new Route('GET', '/hello');
  const log = mockFn();

  const api = new Api({ port: 80 });
  api.addRoute(route);
  plugin(api, { log });

  assertCalledCount(log, 0);

  await testApi(api).request('GET', { uri: '/hello' });

  assertCalledCount(log, 1);
});

Deno.test('Access log plugin set not timestamp', async () => {
  const route = new Route('GET', '/hello');
  const log = mockFn();

  const api = new Api({ port: 80 });
  api.addRoute(route);
  plugin(api, { log, title: 'New Access', noTimestamp: true });

  assertCalledCount(log, 0);

  await testApi(api).request('GET', { uri: '/hello' });

  assertCalledCount(log, 1);
  assertCalledWithAt(log, 0, 0, 'New Access GET http://localhost/hello');
});
