import { assertEquals } from '../../src/dev_deps.ts';
import { mockApi } from '../../dev_mod.ts';
import { EMethod, Route } from '../../mod.ts';
import swaggerPlugin from './plugin.ts';

const info = {
  title: 'Deno swagger test',
  description: 'Testing',
  version: '0.0.0',
};

Deno.test('Endpoint should generate basic data', async () => {
  const route = new Route('GET', '/hello');

  // create api
  const api = mockApi(route);

  // @ts-ignore
  await swaggerPlugin(api, { info });

  await api.sendByArguments('GET', '/swagger.json');

  assertEquals(api?.lastContext?.response.status, 200);

  const body = api?.lastContext?.response.body as Record<string, any>;
  assertEquals(typeof body, 'object');
  assertEquals(body.openapi, '3.0.1');
  assertEquals(body.info?.title, info.title);
  assertEquals(body.info?.description, info.description);
});

Deno.test('Swagger path should contain basic route infos', async () => {
  const route = new Route('GET', '/hello');

  // create api
  const api = mockApi(route);

  // @ts-ignore
  await swaggerPlugin(api, { info });

  await api.sendByArguments('GET', '/swagger.json');

  const body = api?.lastContext?.response.body as Record<string, any>;
  const paths = body?.paths;

  assertEquals(typeof paths['/hello']['get'], 'object');

  assertEquals(
    paths.hasOwnProperty('/swagger.json'),
    false,
    'Swagger endpoint defined',
  );
});

Deno.test('Plugin should hide swagger endpoint', async () => {
  const route = new Route('GET', '/hello');

  // create api
  const api = mockApi(route);

  // @ts-ignore
  await swaggerPlugin(api, { info, allowSwaggerRoutes: true });

  await api.sendByArguments('GET', '/swagger.json');

  const body = api?.lastContext?.response.body as Record<string, any>;
  const paths = body?.paths;

  assertEquals(
    paths.hasOwnProperty('/swagger.json'),
    true,
    'Swagger endpoint defined',
  );
});

Deno.test('Swagger path should contain basic route infos', async () => {
  const route = new Route('GET', '/hello');

  // create api
  const api = mockApi(route);
  api.addRoute(
    new Route(EMethod.POST, '/hello'),
  );

  // @ts-ignore
  await swaggerPlugin(api, { info });

  await api.sendByArguments('GET', '/swagger.json');

  const body = api?.lastContext?.response.body as Record<string, any>;
  const paths = body?.paths;

  assertEquals(
    paths['/hello'].hasOwnProperty('get'),
    true,
    'Should have get method',
  );
  assertEquals(
    paths['/hello'].hasOwnProperty('post'),
    true,
    'Should have post method',
  );
});

Deno.test('Swagger path should be extend with details by props', async () => {
  const route = new Route('GET', '/hello');
  route.prop('swagger', {
    tags: ['testing'],
    summary: 'any desc',
  });

  // create api
  const api = mockApi(route);

  // @ts-ignore
  await swaggerPlugin(api, { info });

  await api.sendByArguments('GET', '/swagger.json');

  const body = api?.lastContext?.response.body as Record<string, any>;
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

  // create api
  const api = mockApi(route);

  // @ts-ignore
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

  await api.sendByArguments('GET', '/swagger.json');

  const body = api?.lastContext?.response.body as Record<string, any>;
  const paths = body?.paths;

  const registPath = paths['/regist']['post'];

  assertEquals(typeof body?.definitions, 'object');
  assertEquals(body?.definitions?.Category.type, 'object');

  assertEquals(registPath?.parameters[0].schema, {
    $ref: '#/definitions/Category',
  });
});
