import { assertEquals } from '../dev_deps.ts';
import { Route } from '../services/route.ts';
import { RequestError } from '../errors/request.error.ts';
import { testRoute } from './test-route.ts';
import { mockFn } from './mock-fn.ts';
import jsonBodyPipe from '../presets/pipes/body/json-body.pipe.ts';

Deno.test('testRoute basic request returns 200', async () => {
  const route = new Route('GET', '/hello');
  route.addPipe(({ response }) => {
    response.body = { msg: 'ok' };
  });

  const result = await testRoute(route).request('GET');

  assertEquals(result.ok, true);
  assertEquals(result.statusCode, 200);
  assertEquals(result.body, { msg: 'ok' });
});

Deno.test('testRoute with explicit uri', async () => {
  const route = new Route('GET', '/hello');
  route.addPipe(({ response }) => {
    response.body = 'ok';
  });

  const result = await testRoute(route).request('GET', { uri: '/hello' });

  assertEquals(result.ok, true);
});

Deno.test('testRoute error sets statusCode from RequestError', async () => {
  const route = new Route('GET', '/fail');
  route.addPipe(() => {
    throw new RequestError('bad input', 400);
  });

  const result = await testRoute(route).request('GET');

  assertEquals(result.ok, false);
  assertEquals(result.statusCode, 400);
  assertEquals(result.error?.message, 'bad input');
});

Deno.test('testRoute generic error sets 500', async () => {
  const route = new Route('GET', '/crash');
  route.addPipe(() => {
    throw new Error('boom');
  });

  const result = await testRoute(route).request('GET');

  assertEquals(result.ok, false);
  assertEquals(result.statusCode, 500);
  assertEquals(result.error?.message, 'boom');
});

Deno.test('testRoute mock pipe by index replaces it', async () => {
  const original = mockFn();
  const replacement = mockFn();

  const route = new Route('GET', '/test');
  // @ts-ignore: mockFn as pipe
  route.addPipe(original);
  route.addPipe(({ response }) => {
    response.body = 'after';
  });

  const result = await testRoute(route)
    // @ts-ignore: mockFn as pipe
    .mock(0, replacement)
    .request('GET');

  assertEquals(original.mock.calls.length, 0);
  assertEquals(replacement.mock.calls.length, 1);
  assertEquals(result.body, 'after');
});

Deno.test('testRoute mock pipe without fn creates no-op', async () => {
  const fn = mockFn();

  const route = new Route('GET', '/test');
  // @ts-ignore: mockFn as pipe
  route.addPipe(fn);
  route.addPipe(({ response }) => {
    response.body = 'second';
  });

  const result = await testRoute(route)
    .mock(0)
    .request('GET');

  assertEquals(fn.mock.calls.length, 0);
  assertEquals(result.body, 'second');
});

Deno.test('testRoute restores original pipes after request', async () => {
  const route = new Route('GET', '/test');
  route.addPipe(({ response }) => {
    response.body = 'original';
  });

  const pipesBefore = [...route.pipes];

  await testRoute(route).mock(0).request('GET');

  assertEquals(route.pipes.length, pipesBefore.length);

  const result = await testRoute(route).request('GET');
  assertEquals(result.body, 'original');
});

Deno.test('testRoute inject overrides DI', async () => {
  const route = new Route('GET', '/di');
  route.injections({ svc: () => 'real' });
  route.addPipe(({ di, response }) => {
    response.body = di.svc();
  });

  const result = await testRoute(route)
    .inject({ svc: () => 'mocked' })
    .request('GET');

  assertEquals(result.body, 'mocked');

  const result2 = await testRoute(route).request('GET');
  assertEquals(result2.body, 'real');
});

Deno.test('testRoute with json body pipe', async () => {
  const route = new Route('POST', '/submit');
  route.addPipe(jsonBodyPipe);
  route.addPipe(({ state, response }) => {
    response.status = 201;
    response.body = state.get('body');
  });

  const result = await testRoute(route)
    .request('POST', { body: { name: 'test' } });

  assertEquals(result.ok, true);
  assertEquals(result.statusCode, 201);
  assertEquals(result.body, { name: 'test' });
});

Deno.test('testRoute result has headers', async () => {
  const route = new Route('GET', '/headers');
  route.addPipe(({ response }) => {
    response.headers.set('X-Custom', 'val');
  });

  const result = await testRoute(route).request('GET');

  assertEquals(result.headers.get('X-Custom'), 'val');
});

Deno.test('testRoute result has context with state', async () => {
  const route = new Route('GET', '/state');
  route.addPipe(({ state, response }) => {
    state.set('key', 'value');
    response.body = 'ok';
  });

  const result = await testRoute(route).request('GET');

  assertEquals(result.context.state.get('key'), 'value');
});

Deno.test('testRoute request with custom headers', async () => {
  const route = new Route('GET', '/hello');
  route.addPipe(({ request, response }) => {
    response.body = { auth: request.headers.get('Authorization') };
  });

  const result = await testRoute(route).request('GET', {
    headers: { 'Authorization': 'Bearer token123' },
  });

  assertEquals(result.body, { auth: 'Bearer token123' });
});

Deno.test('testRoute request with search params', async () => {
  const route = new Route('GET', '/search');
  route.addPipe(({ url, response }) => {
    response.body = { q: url.searchParams.get('q') };
  });

  const result = await testRoute(route).request('GET', {
    params: { q: 'deno' },
  });

  assertEquals(result.body, { q: 'deno' });
});
