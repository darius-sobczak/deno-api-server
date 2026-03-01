import { assertCalledCount, assertCalledWithAt } from '../../src/dev_deps.ts';
import { mockFn } from '../../dev_mod.ts';
import { Api, Route } from '../../mod.ts';
import plugin from './plugin.ts';

Deno.test('Add Route plugin', () => {
  const log = mockFn();

  const api = new Api({ port: 80 });
  plugin(api, { log });

  assertCalledCount(log, 0);
  api.addRoute(new Route('GET', '/hello'));
  assertCalledCount(log, 1);
  assertCalledWithAt(log, 0, 0, 'Add Route GET /hello');
});

Deno.test('Add Route plugin with custom title', () => {
  const log = mockFn();

  const api = new Api({ port: 80 });
  plugin(api, { log, title: 'New Route created' });

  assertCalledCount(log, 0);
  api.addRoute(new Route('POST', '/submit/:id'));
  assertCalledCount(log, 1);
  assertCalledWithAt(log, 0, 0, 'New Route created POST /submit/:id');
});
