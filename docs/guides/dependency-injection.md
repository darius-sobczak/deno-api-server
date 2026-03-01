# Dependency Injection

Routes carry a DI container (`context.di`) that is populated before pipes run. This makes it easy to share services (databases, loggers, config) across pipes without global variables.

## `route.injections(map)`

Pass the entire DI map at once:

```typescript
import { EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

const userRoute = new Route(EMethod.GET, "/users")
  .injections({
    db: database,
    logger: myLogger,
    config: appConfig,
  })
  .addPipe(async ({ di, response }) => {
    const users = await di.db.users.findAll();
    di.logger.info(`Listed ${users.length} users`);
    response.body = users;
  });
```

## `route.inject(name, service, overridable?)`

Add one service at a time. Useful when building routes programmatically:

```typescript
route
  .inject("db", database)
  .inject("mailer", mailer);

// Override in tests
route.inject("db", mockDatabase, true);
```

Throws if the name is already registered and `overridable` is `false` (default).

## Accessing injected services

Inside any pipe, use `context.di`:

```typescript
const handlerPipe: IPipe = async ({ di, match, response }) => {
  const user = await di.db.findUser(match.params.id);
  response.body = user;
};
```

## TypeScript types

`IInjections` is a plain `{ [key: string]: any }` map. For better type safety, cast or narrow inside the pipe:

```typescript
interface MyDI {
  db: Database;
  logger: Logger;
}

const handler: IPipe = ({ di }) => {
  const { db, logger } = di as MyDI;
  // ...
};
```

## Pattern: service factory

Wrap route creation in a factory that accepts services:

```typescript
function createUserRoutes(db: Database, logger: Logger) {
  const shared = { db, logger };

  return [
    new Route(EMethod.GET, "/users")
      .injections(shared)
      .addPipe(listUsersPipe),

    new Route(EMethod.POST, "/users")
      .injections(shared)
      .addPipe(jsonBodyPipe)
      .addPipe(createUserPipe),
  ];
}

// main.ts
const routes = createUserRoutes(db, logger);
routes.forEach((r) => api.addRoute(r));
```

## Pattern: override in tests

```typescript
// production
const route = new Route(EMethod.GET, "/users")
  .inject("db", new PostgresDatabase());

// test
const testRoute = new Route(EMethod.GET, "/users")
  .inject("db", new InMemoryDatabase());
```

## Route-level props vs DI

| | `route.injections()` / `context.di` | `route.prop()` / `route.props` |
|---|---|---|
| Accessible in pipes | Yes (`context.di`) | Via `context.route.props` |
| Purpose | Services and dependencies | Metadata, annotations (e.g. Swagger) |
| Typical content | DB, logger, config | `{ swagger: {...} }`, feature flags |
