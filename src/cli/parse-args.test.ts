import { assertEquals } from '../dev_deps.ts';
import { parseCliArgs } from './parse-args.ts';

Deno.test('parseCliArgs: basic command parsing', () => {
  const result = parseCliArgs(['users/12']);
  assertEquals(result.command, '/users/12');
  assertEquals(result.method, 'GET');
  assertEquals(result.payload, undefined);
  assertEquals(result.params, undefined);
});

Deno.test('parseCliArgs: command with leading slash unchanged', () => {
  const result = parseCliArgs(['/users/12']);
  assertEquals(result.command, '/users/12');
});

Deno.test('parseCliArgs: method flag --method', () => {
  const result = parseCliArgs(['users', '--method', 'DELETE']);
  assertEquals(result.method, 'DELETE');
});

Deno.test('parseCliArgs: method flag -m', () => {
  const result = parseCliArgs(['users', '-m', 'POST']);
  assertEquals(result.method, 'POST');
});

Deno.test('parseCliArgs: payload with JSON object', () => {
  const result = parseCliArgs(['users', '--payload', '{"name":"test"}']);
  assertEquals(result.payload, { name: 'test' });
});

Deno.test('parseCliArgs: payload with -p shorthand', () => {
  const result = parseCliArgs(['users', '-p', '{"id":1}']);
  assertEquals(result.payload, { id: 1 });
});

Deno.test('parseCliArgs: payload with non-JSON string', () => {
  const result = parseCliArgs(['users', '-p', 'hello world']);
  assertEquals(result.payload, 'hello world');
});

Deno.test('parseCliArgs: query params from command', () => {
  const result = parseCliArgs(['users?page=2&limit=10']);
  assertEquals(result.command, '/users');
  assertEquals(result.params, { page: '2', limit: '10' });
});

Deno.test('parseCliArgs: headers with -H', () => {
  const result = parseCliArgs(['users', '-H', 'Authorization: Bearer token']);
  assertEquals(result.headers, { Authorization: 'Bearer token' });
});

Deno.test('parseCliArgs: multiple headers', () => {
  const result = parseCliArgs([
    'users',
    '-H', 'Authorization: Bearer token',
    '-H', 'Accept: application/json',
  ]);
  assertEquals(result.headers, {
    Authorization: 'Bearer token',
    Accept: 'application/json',
  });
});

Deno.test('parseCliArgs: auto POST when payload present', () => {
  const result = parseCliArgs(['users', '-p', '{"name":"test"}']);
  assertEquals(result.method, 'POST');
});

Deno.test('parseCliArgs: explicit method overrides auto-detect', () => {
  const result = parseCliArgs(['users', '-m', 'PUT', '-p', '{"name":"test"}']);
  assertEquals(result.method, 'PUT');
});

Deno.test('parseCliArgs: empty args', () => {
  const result = parseCliArgs([]);
  assertEquals(result.command, '');
  assertEquals(result.method, 'GET');
});
