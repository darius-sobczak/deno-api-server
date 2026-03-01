import { assertEquals } from '../../src/dev_deps.ts';
import { testApi } from '../../dev_mod.ts';
import { Api, EMethod, Route } from '../../mod.ts';
import swaggerPlugin from './plugin.ts';

const info = {
  title: 'Deno swagger test',
  description: 'Testing',
  version: '0.0.0',
};

Deno.test('Endpoint should generate basic data', async () => {
  const route = new Route('GET', '/hello');

  const api = new Api({ port: 80 });
  api.addRoute(route);

  // @ts-ignore: plugin config
  await swaggerPlugin(api, { info });

  const result = await testApi(api).request('GET', { uri: '/swagger.json' });

  assertEquals(result.statusCode, 200);

  // deno-lint-ignore no-explicit-any
  const body = result.body as Record<string, any>;
  assertEquals(typeof body, 'object');
  assertEquals(body.openapi, '3.0.1');
  assertEquals(body.info?.title, info.title);
  assertEquals(body.info?.description, info.description);
});

Deno.test('Swagger path should contain basic route infos', async () => {
  const route = new Route('GET', '/hello');

  const api = new Api({ port: 80 });
  api.addRoute(route);

  // @ts-ignore: plugin config
  await swaggerPlugin(api, { info });

  const result = await testApi(api).request('GET', { uri: '/swagger.json' });

  // deno-lint-ignore no-explicit-any
  const body = result.body as Record<string, any>;
  const paths = body?.paths;

  assertEquals(typeof paths['/hello']['get'], 'object');
  assertEquals(Object.hasOwn(paths, '/swagger.json'), false, 'Swagger endpoint defined');
});

Deno.test('Plugin should hide swagger endpoint', async () => {
  const route = new Route('GET', '/hello');

  const api = new Api({ port: 80 });
  api.addRoute(route);

  // @ts-ignore: plugin config
  await swaggerPlugin(api, { info, allowSwaggerRoutes: true });

  const result = await testApi(api).request('GET', { uri: '/swagger.json' });

  // deno-lint-ignore no-explicit-any
  const body = result.body as Record<string, any>;
  const paths = body?.paths;

  assertEquals(Object.hasOwn(paths, '/swagger.json'), true, 'Swagger endpoint defined');
});

Deno.test('Swagger path should contain basic route infos', async () => {
  const route = new Route('GET', '/hello');

  const api = new Api({ port: 80 });
  api.addRoute(route);
  api.addRoute(new Route(EMethod.POST, '/hello'));

  // @ts-ignore: plugin config
  await swaggerPlugin(api, { info });

  const result = await testApi(api).request('GET', { uri: '/swagger.json' });

  // deno-lint-ignore no-explicit-any
  const body = result.body as Record<string, any>;
  const paths = body?.paths;

  assertEquals(Object.hasOwn(paths['/hello'], 'get'), true, 'Should have get method');
  assertEquals(Object.hasOwn(paths['/hello'], 'post'), true, 'Should have post method');
});

Deno.test('Swagger path should be extend with details by props', async () => {
  const route = new Route('GET', '/hello');
  route.prop('swagger', {
    tags: ['testing'],
    summary: 'any desc',
  });

  const api = new Api({ port: 80 });
  api.addRoute(route);

  // @ts-ignore: plugin config
  await swaggerPlugin(api, { info });

  const result = await testApi(api).request('GET', { uri: '/swagger.json' });

  // deno-lint-ignore no-explicit-any
  const body = result.body as Record<string, any>;
  const paths = body?.paths;

  const helloPath = paths['/hello']['get'];

  assertEquals(typeof helloPath, 'object');
  assertEquals(helloPath.tags, ['testing']);
});

Deno.test('Swagger definitions ref schema', async () => {
  const route = new Route('POST', '/regist');

  route.prop('swagger', {
    parameters: [
      {
        in: 'body',
        name: 'body',
        description: 'any',
        required: true,
        schema: {
          $ref: '#/definitions/Category',
        },
      },
    ],
  });

  const api = new Api({ port: 80 });
  api.addRoute(route);

  // @ts-ignore: plugin config
  await swaggerPlugin(api, {
    info,
    definitions: {
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
        },
      },
    },
  });

  const result = await testApi(api).request('GET', { uri: '/swagger.json' });

  // deno-lint-ignore no-explicit-any
  const body = result.body as Record<string, any>;
  const paths = body?.paths;

  const registPath = paths['/regist']['post'];

  assertEquals(typeof body?.definitions, 'object');
  assertEquals(body?.definitions?.Category.type, 'object');

  assertEquals(registPath?.parameters[0].schema, {
    $ref: '#/definitions/Category',
  });
});
