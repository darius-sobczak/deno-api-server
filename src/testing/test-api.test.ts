import { assertEquals } from '../dev_deps.ts';
import { Api } from '../services/api.ts';
import { Route } from '../services/route.ts';
import { RequestError } from '../errors/request.error.ts';
import { AccessDeniedError } from '../errors/access-denied.error.ts';
import { testApi } from './test-api.ts';
import jsonBodyPipe from '../presets/pipes/body/json-body.pipe.ts';

function createApi(...routes: Route[]): Api {
  const api = new Api({ port: 80 });
  for (const r of routes) api.addRoute(r);
  return api;
}

Deno.test('testApi basic GET returns 200', async () => {
  const route = new Route('GET', '/hello');
  route.addPipe(({ response }) => {
    response.body = { msg: 'ok' };
  });

  const api = createApi(route);
  const result = await testApi(api).request('GET', { uri: '/hello' });

  assertEquals(result.ok, true);
  assertEquals(result.statusCode, 200);
  assertEquals(result.body, { msg: 'ok' });
});

Deno.test('testApi 404 for unknown route', async () => {
  const api = createApi();
  const result = await testApi(api).request('GET', { uri: '/nope' });

  assertEquals(result.ok, false);
  assertEquals(result.statusCode, 404);
});

Deno.test('testApi RequestError sets correct status', async () => {
  const route = new Route('POST', '/fail');
  route.addPipe(() => {
    throw new RequestError('invalid', 422);
  });

  const api = createApi(route);
  const result = await testApi(api).request('POST', { uri: '/fail' });

  assertEquals(result.ok, false);
  assertEquals(result.statusCode, 422);
});

Deno.test('testApi AccessDeniedError sets 403', async () => {
  const route = new Route('GET', '/secret');
  route.addPipe(() => {
    throw new AccessDeniedError('forbidden');
  });

  const api = createApi(route);
  const result = await testApi(api).request('GET', { uri: '/secret' });

  assertEquals(result.ok, false);
  assertEquals(result.statusCode, 403);
});

Deno.test('testApi inject overrides DI', async () => {
  const route = new Route('GET', '/di');
  route.injections({ svc: () => 'real' });
  route.addPipe(({ di, response }) => {
    response.body = di.svc();
  });

  const api = createApi(route);

  const result = await testApi(api)
    .inject({ svc: () => 'mocked' })
    .request('GET', { uri: '/di' });

  assertEquals(result.body, 'mocked');

  const result2 = await testApi(api).request('GET', { uri: '/di' });
  assertEquals(result2.body, 'real');
});

Deno.test('testApi POST with json body', async () => {
  const route = new Route('POST', '/submit');
  route.addPipe(jsonBodyPipe);
  route.addPipe(({ state, response }) => {
    response.status = 201;
    response.body = state.get('body');
  });

  const api = createApi(route);
  const result = await testApi(api)
    .request('POST', { uri: '/submit', body: { name: 'test' } });

  assertEquals(result.ok, true);
  assertEquals(result.statusCode, 201);
  assertEquals(result.body, { name: 'test' });
});

Deno.test('testApi with multiple routes resolves correct one', async () => {
  const route1 = new Route('GET', '/a');
  route1.addPipe(({ response }) => { response.body = 'a'; });

  const route2 = new Route('GET', '/b');
  route2.addPipe(({ response }) => { response.body = 'b'; });

  const api = createApi(route1, route2);

  const resultA = await testApi(api).request('GET', { uri: '/a' });
  assertEquals(resultA.body, 'a');

  const resultB = await testApi(api).request('GET', { uri: '/b' });
  assertEquals(resultB.body, 'b');
});

Deno.test('testApi with search params', async () => {
  const route = new Route('GET', '/search');
  route.addPipe(({ url, response }) => {
    response.body = { q: url.searchParams.get('q') };
  });

  const api = createApi(route);
  const result = await testApi(api).request('GET', {
    uri: '/search',
    params: { q: 'deno' },
  });

  assertEquals(result.body, { q: 'deno' });
});
