/**
 * example to integrate Third party library to auth by json web token
 * @obsolate please use on new version of deno the global Crypto API
 * @see https://deno.land/x/djwt
 */
import { AccessDeniedError, Api, EMethod, IContext, Route } from '../mod.ts';

// create an api instance
const api = new Api({ port: 8080 });

// import status plugin
import statusPlugin from '../plugins/status/plugin.ts';

// add status endpoint using plugin
statusPlugin(api);

import { create, verify } from 'https://deno.land/x/djwt/mod.ts';

const HEADER_KEY = 'token';
const STATE_KEY = 'auth';
const SECRET = 'DENOAPI20';

// Create a CryptoKey for HMAC-SHA512
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(SECRET),
  { name: "HMAC", hash: "SHA-512" },
  false,
  ["sign", "verify"]
);

/**
 * create custom verify token
 */
async function verifyPipe({ request, state }: IContext) {
  if (request.headers.has(HEADER_KEY)) {
    try {
      const jwt = request.headers.get(HEADER_KEY);
      if (typeof jwt === 'string') {
        const payload = await verify(jwt, key);
        state.set(STATE_KEY, payload);
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      throw new AccessDeniedError(error.message, 403, error);
    }
  }
  // maybe you throw an error if header and token not valid
}

  // to secure other endpointy by detect right
  function hasRightPipe(name: string) {
    return ({ state }: IContext) => {
      if (state.has(STATE_KEY)) {
        const auth = state.get(STATE_KEY);
        if (auth && Array.isArray(auth.rights)) {
          if (auth.rights.includes(name)) {
            return; // continue
          }
        }
      }

      throw new AccessDeniedError();
    };
  }

////// add routes

api
  // add example to create jwt
  .addRoute(
    new Route(EMethod.GET, '/auth')
      .addPipe(async ({ response }) => {
        const authModel = {
          name: 'api-server',
          rights: ['test'],
        };
    // tip use expire token for more secure
    const token = await create(
      { alg: 'HS512', typ: 'JWT' },
      authModel,
      key,
    );

        response.body = { token };
      }),
  )
  // add example to create jwt
  .addRoute(
    new Route(EMethod.GET, '/safe')
      // deconstruct jwt if possible
      .addPipe(verifyPipe)
      // save by rights
      .addPipe(hasRightPipe('test'))
      // success
      .addPipe(async ({ response, state }) => {
        response.body = {
          message: 'safe',
          authData: state.get(STATE_KEY),
        };
      }),
  );

// start server
console.log(`Start server localhost:${api.serverConfig.port}`);
await api.listen();

/**
 try it

 to get an token
 curl --location --request GET 'http://localhost:8080/auth' \
 --header 'Content-Type: application/json' \
 --data-raw '{
    "name": "deno"
}'

 curl --location --request GET 'http://localhost:8080/safe' \
 --header 'token: eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYXBpLXNlcnZlciIsInJpZ2h0cyI6WyJ0ZXN0Il19.rQu0bx4gFE1aLOhfdC8kcGxNlWeE9x0xbJ89XdmxXg5LsQO1deFKfS4x5okbyPXJz_o3ujD1KwI9D84ikxqdCQ'

*/
