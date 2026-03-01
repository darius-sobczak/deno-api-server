/**
 * Examples: how to test your API with testRoute and testApi
 */

import {
  assertCalledCount,
  assertCalledWith,
  assertCalledWithAt,
  assertEquals,
} from '../src/dev_deps.ts';
import { AccessDeniedError, Api, EMethod, IContext, RequestError, Route } from '../mod.ts';
import { mockContext, mockFn, testApi, testRoute } from '../dev_mod.ts';
import jsonBodyPipe from '../src/presets/pipes/body/json-body.pipe.ts';

// --- mockFn examples ---

Deno.test('Example who to use util mockFn', async () => {
  const m = mockFn();

  const route = new Route('GET', '/hello');
  route.addPipe(() => {
    m();
  });

  const result = await testRoute(route).request('GET');

  assertEquals(result.ok, true);
  assertEquals(result.statusCode, 200);
  assertEquals(m.mock.calls.length, 1);
});

Deno.test('Example who to use util mockFn with assert funtions', () => {
  const m = mockFn();

  assertCalledCount(m, 0);

  m();
  m('hello');
  m('hello my', 12);

  assertCalledCount(m, 3);
  assertCalledWith(m, 1, ['hello']);
  assertCalledWithAt(m, 1, 0, 'hello');
});

Deno.test('Example who to use util mockFn as injection', async () => {
  const say = mockFn();

  const route = new Route('GET', '/hello');
  route.addPipe(({ di }) => {
    di.callMe.say('hello');
  });

  const result = await testRoute(route)
    .inject({ callMe: { say } })
    .request('GET');

  assertEquals(result.ok, true);
  assertEquals(say.mock.calls.length, 1);
  assertEquals(say.mock.calls[0], ['hello']);
});

// --- testRoute examples ---

Deno.test('Example testRoute basic request', async () => {
  const route = new Route('GET', '/hello');
  route.addPipe(({ response }) => {
    response.body = { kind: 'test' };
  });

  const result = await testRoute(route).request('GET');

  assertEquals(result.ok, true);
  assertEquals(result.statusCode, 200);
  assertEquals(result.body, { kind: 'test' });
});

Deno.test('Example testRoute with request headers', async () => {
  const route = new Route('GET', '/hello');
  route.addPipe(({ response, request }) => {
    response.body = {
      kind: 'test',
      header: request.headers.get('test-env'),
    };
  });

  const result = await testRoute(route).request('GET', {
    headers: { 'test-env': 'deno test' },
  });

  assertEquals(result.ok, true);
  assertEquals(result.body.header, 'deno test');
});

Deno.test('Route example will throw request error', async () => {
  const route = new Route('GET', '/hello');
  route.addPipe(() => {
    throw new RequestError('error x', 400);
  });

  const result = await testRoute(route).request('GET');

  assertEquals(result.ok, false);
  assertEquals(result.statusCode, 400);
  assertEquals(result.error?.message, 'error x');
});

Deno.test('Example testRoute POST with json body', async () => {
  const route = new Route('POST', '/submit');
  route
    .addPipe(jsonBodyPipe)
    .addPipe(({ state, response }) => {
      response.status = 201;
      response.body = state.get('body');
    });

  const result = await testRoute(route)
    .request('POST', { body: { name: 'super' } });

  assertEquals(result.ok, true);
  assertEquals(result.statusCode, 201);
  assertEquals(result.body, { name: 'super' });
});

Deno.test('Example testRoute mock pipe to skip auth', async () => {
  const route = new Route('GET', '/protected');
  route
    .addPipe(() => {
      throw new AccessDeniedError('forbidden');
    })
    .addPipe(({ response }) => {
      response.body = { data: 'secret' };
    });

  // Skip the auth pipe (index 0), only test handler
  const result = await testRoute(route)
    .mock(0)
    .request('GET');

  assertEquals(result.ok, true);
  assertEquals(result.body, { data: 'secret' });
});

Deno.test('Example testRoute mock pipe with replacement', async () => {
  const route = new Route('GET', '/hello');
  route
    .addPipe(({ state }) => {
      state.set('user', 'real-user');
    })
    .addPipe(({ state, response }) => {
      response.body = { user: state.get('user') };
    });

  const result = await testRoute(route)
    .mock(0, ({ state }) => {
      state.set('user', 'test-user');
    })
    .request('GET');

  assertEquals(result.body, { user: 'test-user' });
});

// --- testApi examples ---

Deno.test('Example testApi route success request', async () => {
  const route = new Route('POST', '/hello');
  route.addPipe(() => {
    throw new RequestError('api error', 400);
  });

  const api = new Api({ port: 80 });
  api.addRoute(route);

  const result = await testApi(api).request('POST', { uri: '/hello' });

  assertEquals(result.ok, false);
  assertEquals(result.statusCode, 400);
});

Deno.test('Example testApi route to mock injections', async () => {
  const route = new Route('POST', '/hello');
  route
    .injections({
      getConnection(_name: string) {
        return {
          list() {
            return Promise.resolve(['fake-db']);
          },
        };
      },
    })
    .addPipe(async ({ di, response }) => {
      const db = di.getConnection();
      const items = await db.list();
      response.body = items;
    });

  const api = new Api({ port: 80 });
  api.addRoute(route);

  const result1 = await testApi(api).request('POST', { uri: '/hello' });
  assertEquals(result1.body, ['fake-db']);

  const result2 = await testApi(api)
    .inject({
      getConnection() {
        return {
          list() {
            return Promise.resolve(['mocked']);
          },
        };
      },
    })
    .request('POST', { uri: '/hello' });
  assertEquals(result2.body, ['mocked']);
});

import * as diTestServices from './fixtures/service-x.ts';
Deno.test('Testing for module injetion in routes', async () => {
  const route = new Route(EMethod.GET, '/testing/di');
  route.injections(diTestServices);
  route.addPipe(({ response, di }) => {
    response.body = { out: di.serviceX() };
  });

  const api = new Api({ port: 80 });
  api.addRoute(route);

  const result = await testApi(api)
    .inject({ serviceX: () => 'mockedX' })
    .request(EMethod.GET, { uri: '/testing/di' });

  assertEquals(result.body, { out: 'mockedX' });
  assertEquals(result.statusCode, 200);
});

Deno.test('Testing api mocked status code', async () => {
  const route = new Route(EMethod.GET, '/testing/di');
  route.addPipe(() => {
    throw new AccessDeniedError('403 error');
  });

  const api = new Api({ port: 80 });
  api.addRoute(route);

  const result = await testApi(api).request(EMethod.GET, { uri: '/testing/di' });

  assertEquals(result.ok, false);
  assertEquals(result.statusCode, 403);
});

// --- mockContext for direct pipe testing ---

Deno.test('Example for testing custom pipes', async () => {
  const myPipe = (context: IContext) => {
    context.response.headers.set('custom', 'xxxx');
  };

  const context = mockContext({});
  assertEquals(context.response.headers.get('custom'), null);

  await myPipe(context);

  assertEquals(context.response.headers.get('custom'), 'xxxx');
});
