[DONE] make pipes readonly

Implemented: 2026-03-01 by Claude Sonnet 4.6

update routes pipes as read only, easer for unit tests

# Implementation plan by Claude Sonnet 4.6 at 2026-03-01

## Changes made

### `src/definition/types.ts`
- Added `readonly pipes: ReadonlyArray<IPipe>` to the `IRoute` interface
- External consumers (e.g. unit tests) can read the pipe list without mutating it

### `src/services/route.ts`
- Changed `protected pipes: Function[]` to `public pipes: IPipe[]`
- `public` exposes the array for direct pipe access in unit tests
- Proper `IPipe` typing replaces the loose `Function` type

## Result
Unit tests can now inspect a route's pipes and call individual ones in isolation:

```ts
const route = new Route('GET', '/users');
route.addPipe(authPipe).addPipe(handlerPipe);

// test only the handler, skip auth
const ctx = buildMockContext();
await route.pipes[1](ctx);
```
