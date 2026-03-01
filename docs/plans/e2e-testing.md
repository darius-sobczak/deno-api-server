[OPEN] e2e testing

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