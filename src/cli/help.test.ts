import { assertEquals } from '../dev_deps.ts';
import { Api } from '../services/api.ts';
import { Route } from '../services/route.ts';
import { printHelp, printRouteHelp } from './help.ts';

function createApi(...routes: Route[]): Api {
  const api = new Api({ port: 80 });
  for (const r of routes) api.addRoute(r);
  return api;
}

function captureConsole(fn: () => void): string[] {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  };
  try {
    fn();
  } finally {
    console.log = original;
  }
  return lines;
}

Deno.test('printHelp: lists all routes', () => {
  const r1 = new Route('GET', '/users');
  const r2 = new Route('POST', '/users');
  const api = createApi(r1, r2);

  const lines = captureConsole(() => printHelp(api));
  const output = lines.join('\n');

  assertEquals(output.includes('GET /users'), true);
  assertEquals(output.includes('POST /users'), true);
});

Deno.test('printHelp: shows description from cli prop', () => {
  const route = new Route('GET', '/hello');
  route.prop('cli', { description: 'Say hello' });
  const api = createApi(route);

  const lines = captureConsole(() => printHelp(api));
  const output = lines.join('\n');

  assertEquals(output.includes('Say hello'), true);
});

Deno.test('printHelp: falls back to swagger description', () => {
  const route = new Route('GET', '/status');
  route.prop('swagger', { summary: 'Health check' });
  const api = createApi(route);

  const lines = captureConsole(() => printHelp(api));
  const output = lines.join('\n');

  assertEquals(output.includes('Health check'), true);
});

Deno.test('printHelp: empty routes message', () => {
  const api = createApi();
  const lines = captureConsole(() => printHelp(api));
  const output = lines.join('\n');

  assertEquals(output.includes('no routes registered'), true);
});

Deno.test('printRouteHelp: shows detailed route info', () => {
  const route = new Route('GET', '/users/:id');
  route.prop('cli', {
    description: 'Get user by ID',
    examples: ['users/12', 'users/42 --header "Authorization: Bearer token"'],
  });

  const lines = captureConsole(() => printRouteHelp(route));
  const output = lines.join('\n');

  assertEquals(output.includes('GET /users/:id'), true);
  assertEquals(output.includes('Get user by ID'), true);
  assertEquals(output.includes('users/12'), true);
  assertEquals(output.includes('users/42'), true);
});

Deno.test('printRouteHelp: falls back to swagger', () => {
  const route = new Route('POST', '/submit');
  route.prop('swagger', { description: 'Submit data' });

  const lines = captureConsole(() => printRouteHelp(route));
  const output = lines.join('\n');

  assertEquals(output.includes('Submit data'), true);
});
