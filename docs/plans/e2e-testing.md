[DONE] e2e testing

all routes have to integrate a clean way for e2e testing by using Deno test with flag for e2e testing, it have to be specifire how to mock or execute routes without any motifications

integrate option to create the unit test like this
const ur = testRoute(route)
const result = ur.request(method, uri, ....)
result.ok
result.body
result.statusCode
...

const ur = testRoute(route)
const result = ur.mock(0, () => {}).request(...)
....

const ur.mock(1); // will mock pipe, without execute

const api = testApi(api)
....

# Implementation plan by Claude Opus 4.6 at 2026-03-01

## New files
- `src/testing/test-route.ts` — `testRoute(route)` → `TestRoute` with `.mock()`, `.inject()`, `.request()`
- `src/testing/test-api.ts` — `testApi(api)` → `TestApi` with `.inject()`, `.request()`
- `src/testing/test-route.test.ts` — 10 tests
- `src/testing/test-api.test.ts` — 7 tests

## Removed files
- `src/testing/mock-api.ts` — replaced by `testRoute` + `testApi`
- `src/testing/mock-api.test.ts` — replaced

## Updated files
- `dev_mod.ts` — exports `testRoute`, `testApi`, `TestRoute`, `TestApi`, `ITestResult`; removed `mockApi`, `MockApi`
- `example/unit-testing.test.ts` — rewritten to showcase new API
- `plugins/access-log/plugin.test.ts` — migrated from mockApi to testApi
- `plugins/add-route/plugin.test.ts` — migrated
- `plugins/healthcheck/plugin.test.ts` — migrated
- `plugins/status/status.test.ts` — migrated, cleaned unused imports
- `plugins/swagger/plugin.test.ts` — migrated, replaced hasOwnProperty with Object.hasOwn
- `src/services/api.test.ts` — extends Api directly instead of MockApi

## ITestResult
```ts
{ ok, body, statusCode, headers, context, error? }
```

## Coverage
- test-route.ts: 98.7% line / 93.8% branch
- test-api.ts: 93.2% line / 78.6% branch
- Overall: 80.7% line / 74.2% branch
- 61 tests, all passing
