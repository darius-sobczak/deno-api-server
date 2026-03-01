[DONE] project problems

Implemented: 2026-03-01 by Claude Sonnet 4.6

check if you see some issues that have to fix
check security issues
make a report what have to be change

# Implementation plan by Claude Sonnet 4.6 at 2026-03-01

## Security & Code Hygiene Report

### Summary

| Category         | Issues Found | Auto-Fixed |
|------------------|-------------|------------|
| Bugs             | 3           | 0          |
| Type Safety      | 48          | 0          |
| Code Hygiene     | 20          | 0          |
| Hardcoded Secrets| 0           | —          |

---

### HIGH — Bugs (fix this sprint)

**1. `for...in` over array — `src/services/route.ts:138`**
```ts
// WRONG — for...in iterates over index strings ("0", "1", ...)
for (let pipe in this.pipes) {
  const feedback = await this.pipes[pipe](context);
}
// CORRECT
for (const pipe of this.pipes) {
  const feedback = await pipe(context);
}
```
`for...in` works coincidentally here but is semantically wrong for arrays.
It also iterates over any enumerable properties added to `Array.prototype`.

**2. Unsafe `catch (e)` access — `src/presets/pipes/body/json-body.pipe.ts:16`**
```ts
} catch (e) {
  throw new RequestError(e.message, 400); // e is `unknown`, .message not guaranteed
}
```
With `useUnknownInCatchVariables: true` in tsconfig, `e` is `unknown`.
Fix: `throw new RequestError(e instanceof Error ? e.message : String(e), 400);`

**3. Unsafe `catch (e)` usage — `src/testing/mock-api.ts:91,100`**
```ts
} catch (e) {
  this.handleError(response, e);       // expects Error, gets unknown
  this.lastError = e;                  // typed as string | Error | undefined
  dispatchEvent(new ErrorEvent(..., e, ...)); // expects Error, gets unknown
}
```
Same root cause as above — `e` must be narrowed before use.

---

### MEDIUM — Type Safety

**`no-explicit-any` — 24 occurrences** across core files:
- `src/definition/types.ts` — `IStateMap`, `IInjections`, `IResponse.body`, `IRoute.parent`, `IMatch`
- `src/services/route.ts` — `prop()`, `inject()`, `state: new Map<string, any>()`
- `src/services/api.ts`, `src/services/raw.ts`, `src/services/matcher/uri-match.ts`
- Plugins: `access-log`, `add-route`, `status`, `swagger`

**`no-prototype-builtins` — 7 occurrences**
Using `obj.hasOwnProperty(key)` instead of `Object.hasOwn(obj, key)`:
- `src/services/route.ts:76` — `inject()` method
- `src/services/api.ts:50` — route loop
- `plugins/swagger/plugin.test.ts` — 4 occurrences

**`ban-types` — 3 occurrences**
`Function` type used (provides no type safety):
- `src/testing/mock-fn.ts:4,12` — `implementation: Function`, `fn: Function`
- `src/services/api.ts:141` — inferred `Function`

**`ban-ts-comment` — 14 occurrences**
`@ts-ignore` used without an explanatory comment:
- `src/definition/types.ts:10` — suppresses `IStateMap` interface issue
- `src/testing/mock-fn.ts:27,29,31,33` — 4 suppressions in mockFn impl
- `src/testing/mock-context.ts:40`
- `plugins/swagger/plugin.test.ts` — 5 occurrences
- `plugins/swagger/plugin.ts:142`
- `src/services/route.test.ts:23`

---

### LOW — Code Hygiene

**`no-unused-vars` — 7 occurrences**
- `plugins/access-log/plugin.ts:17` — `api` param unused
- `plugins/add-route/plugin.ts:14` — `api` param unused
- `plugins/status/status.test.ts:2,9` — unused `assertEquals`, `log`
- `example/unit-testing.test.ts:169` — `response`, `request` unused
- `example/unit-testing.test.ts:209` — `name` param unused

**`require-await` — 10 occurrences** (async functions with no await — mostly in tests)
- `example/authentification-jwt.ts:97`
- `example/main.ts:150`
- `example/unit-testing.test.ts:37,166`
- `plugins/add-route/plugin.test.ts:7,22`
- `src/services/route.test.ts:36,44`
- `src/testing/mock-fn.test.ts:32,39`

**`prefer-const` — 3 occurrences**
- `src/services/route.ts:139` — `let pipe` → `const pipe`
- `src/services/api.ts:55` — `let route` → `const route`
- `plugins/access-log/plugin.ts:34` — `let pattern` → `const pattern`

---

### Security Findings

**No hardcoded secrets detected.**
**No use of `eval`, `innerHTML`, or injection-prone patterns.**
**No vulnerable dependency patterns detected** (Deno has no built-in audit; verify JSR/npm advisories manually for `deno.land/std@0.224.0`).

---

### Action Points (priority order)

1. **Fix `for...in` on array** in `src/services/route.ts:138` → use `for...of`
2. **Narrow `catch (e)` in json-body pipe** → `e instanceof Error ? e.message : String(e)`
3. **Narrow `catch (e)` in mock-api** → type-guard before passing to typed functions
4. **Replace `hasOwnProperty` with `Object.hasOwn()`** in route.ts and api.ts
5. **Replace `Function` type** in mock-fn.ts with proper generic signatures
6. **Add explanatory comments** to all `@ts-ignore` directives
7. **Reduce `any` in core types** — `IStateMap`, `IInjections`, `IMatch.params` are candidates for generics
8. **Fix `prefer-const`** in route.ts, api.ts, access-log plugin (trivial)
9. **Fix `no-unused-vars`** in plugins — prefix unused params with `_`
10. **Remove unnecessary `async`** from test pipe functions
