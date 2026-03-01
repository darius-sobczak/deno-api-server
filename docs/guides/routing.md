# Routing

The `Route` constructor accepts three URI matching strategies. Choose based on how much flexibility you need.

## 1. Plain string — exact match

```typescript
new Route(EMethod.GET, "/users")
```

Implemented by `UriMatch`. Matches only when `url.pathname === uri` exactly. No wildcards, no parameters.

Use for fixed paths like `/health`, `/status`, `/login`.

---

## 2. URLPattern — parameter capture

```typescript
new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" }))
```

Uses the standard [URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API). Parameters are available in `context.match.params`.

```typescript
.addPipe(({ match, response }) => {
  const { id } = match.params; // string
  response.body = { id };
})
```

`match.matches` contains the full `URLPatternResult` for advanced use.

### Multiple parameters

```typescript
new Route(EMethod.GET, new URLPattern({ pathname: "/orgs/:org/repos/:repo" }))
// match.params.org, match.params.repo
```

### Wildcard

```typescript
new Route(EMethod.GET, new URLPattern({ pathname: "/static/*" }))
// matches /static/anything/here
```

---

## 3. Custom `IMatcher`

```typescript
import { IMatcher, IMatching } from "https://deno.land/x/deno_api_server/mod.ts";

class RegexMatcher implements IMatcher {
  readonly uri: string;
  private regex: RegExp;

  constructor(pattern: string, regex: RegExp) {
    this.uri = pattern;
    this.regex = regex;
  }

  getMatch(url: URL): IMatching {
    const m = url.pathname.match(this.regex);
    if (!m) return null;
    return { url, uri: this.uri, params: { match: m } };
  }
}

new Route(EMethod.GET, new RegexMatcher("/items/*", /^\/items\/(.+)$/))
```

Implement `getMatch(url)` and return `null` for no match, or an object with at least `{ url, uri, params }`.

---

## `UriMatch`

`src/services/matcher/uri-match.ts`

The default matcher used when a plain string is passed.

```typescript
import { UriMatch } from "https://deno.land/x/deno_api_server/mod.ts";

new Route(EMethod.GET, new UriMatch("/exact-path"))
```

---

## HTTP methods

Use `EMethod` constants:

```typescript
import { EMethod } from "https://deno.land/x/deno_api_server/mod.ts";

EMethod.GET     // "get"
EMethod.POST    // "post"
EMethod.PUT     // "put"
EMethod.PATCH   // "patch"
EMethod.DELETE  // "delete"
EMethod.HEAD    // "head"
```

Methods are stored upper-cased internally but `EMethod` values are lower-case — both work because matching is case-insensitive.

### Multiple methods on one route

```typescript
new Route([EMethod.GET, EMethod.HEAD], "/ping")
  .addPipe(({ response }) => {
    response.body = { pong: true };
  })
```

---

## Route matching order

Routes are matched in registration order. The **first** match wins.

```typescript
// More specific first
api.addRoute(new Route(EMethod.GET, "/users/me"));
api.addRoute(new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" })));
```

---

## Query parameters

Query parameters are not part of routing. Access them via `context.url.searchParams`:

```typescript
.addPipe(({ url, response }) => {
  const page = url.searchParams.get("page") ?? "1";
  response.body = { page: Number(page) };
})
```
