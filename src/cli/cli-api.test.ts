import { assertEquals } from '../dev_deps.ts';
import { Api } from '../services/api.ts';
import { Route } from '../services/route.ts';
import { RequestError } from '../errors/request.error.ts';
import { CliApi } from './cli-api.ts';
import jsonBodyPipe from '../presets/pipes/body/json-body.pipe.ts';

function createApi(...routes: Route[]): Api {
  const api = new Api({ port: 80 });
  for (const r of routes) api.addRoute(r);
  return api;
}

Deno.test('CliApi: execute GET route', async () => {
  const route = new Route('GET', '/hello');
  route.addPipe(({ response }) => {
    response.body = { msg: 'ok' };
  });

  const api = createApi(route);
  const cli = new CliApi(api);
  const result = await cli.execute({ command: '/hello', method: 'GET' });

  assertEquals(result.ok, true);
  assertEquals(result.status, 200);
  assertEquals(result.body, { msg: 'ok' });
});

Deno.test('CliApi: execute POST with payload', async () => {
  const route = new Route('POST', '/submit');
  route.addPipe(jsonBodyPipe);
  route.addPipe(({ state, response }) => {
    response.status = 201;
    response.body = state.get('body');
  });

  const api = createApi(route);
  const cli = new CliApi(api);
  const result = await cli.execute({
    command: '/submit',
    method: 'POST',
    payload: { name: 'test' },
  });

  assertEquals(result.ok, true);
  assertEquals(result.status, 201);
  assertEquals(result.body, { name: 'test' });
});

Deno.test('CliApi: 404 for unknown route', async () => {
  const api = createApi();
  const cli = new CliApi(api);
  const result = await cli.execute({ command: '/nope', method: 'GET' });

  assertEquals(result.ok, false);
  assertEquals(result.status, 404);
});

Deno.test('CliApi: error handling for route that throws', async () => {
  const route = new Route('GET', '/fail');
  route.addPipe(() => {
    throw new RequestError('bad input', 422);
  });

  const api = createApi(route);
  const cli = new CliApi(api);
  const result = await cli.execute({ command: '/fail', method: 'GET' });

  assertEquals(result.ok, false);
  assertEquals(result.status, 422);
  assertEquals(result.error?.message, 'bad input');
});

Deno.test('CliApi: generic error sets 500', async () => {
  const route = new Route('GET', '/crash');
  route.addPipe(() => {
    throw new Error('unexpected');
  });

  const api = createApi(route);
  const cli = new CliApi(api);
  const result = await cli.execute({ command: '/crash', method: 'GET' });

  assertEquals(result.ok, false);
  assertEquals(result.status, 500);
});

Deno.test('CliApi: search params passed to route', async () => {
  const route = new Route('GET', '/search');
  route.addPipe(({ url, response }) => {
    response.body = { q: url.searchParams.get('q') };
  });

  const api = createApi(route);
  const cli = new CliApi(api);
  const result = await cli.execute({
    command: '/search',
    method: 'GET',
    params: { q: 'deno' },
  });

  assertEquals(result.body, { q: 'deno' });
});

Deno.test('CliApi: custom headers passed to route', async () => {
  const route = new Route('GET', '/auth');
  route.addPipe(({ request, response }) => {
    response.body = { token: request.headers.get('Authorization') };
  });

  const api = createApi(route);
  const cli = new CliApi(api);
  const result = await cli.execute({
    command: '/auth',
    method: 'GET',
    headers: { Authorization: 'Bearer abc123' },
  });

  assertEquals(result.body, { token: 'Bearer abc123' });
});
