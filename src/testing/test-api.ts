import { Api } from '../services/api.ts';
import { IInjections } from '../definition/types.ts';
import { RequestError } from '../errors/request.error.ts';
import { EEvent } from '../definition/event.ts';
import RequestEvent from '../definition/events/request.event.ts';
import RouteEvent from '../definition/events/route.event.ts';
import ErrorEvent from '../definition/events/error.event.ts';
import { mockRequest } from './mock-request.ts';
import { mockResponse } from './mock-response.ts';
import { IRequestOptions, ITestResult } from './test-route.ts';

export class TestApi {
  private api: Api;
  private diOverrides: IInjections = {};

  constructor(api: Api) {
    this.api = api;
  }

  /**
   * Override DI services for next requests.
   */
  inject(di: IInjections): TestApi {
    this.diOverrides = { ...this.diOverrides, ...di };
    return this;
  }

  async request(method: string, options?: IRequestOptions): Promise<ITestResult> {
    const uri = options?.uri ?? '/';
    const request = mockRequest(method, uri, options?.body);
    const response = mockResponse();
    const url = new URL(uri, 'http://localhost');

    // Apply search params
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, value);
      }
    }

    // Apply extra headers
    if (options?.headers) {
      const entries = options.headers instanceof Headers
        ? options.headers.entries()
        : Object.entries(options.headers);
      for (const [key, value] of entries) {
        request.headers.set(key, value);
      }
    }

    const route = this.api.getRouteByRequest(request, url);

    let context;
    let error: Error | undefined;

    try {
      dispatchEvent(new RequestEvent(EEvent.BEFORE_REQUEST, request, response));

      if (route) {
        const savedDi = { ...route.di };
        if (Object.keys(this.diOverrides).length > 0) {
          route.di = { ...savedDi, ...this.diOverrides };
        }

        dispatchEvent(new RouteEvent(EEvent.BEFORE_ROUTE, route));
        context = await route.execute(url, request, response);

        route.di = savedDi;
      } else {
        dispatchEvent(
          new RequestEvent(EEvent.ROUTE_NOT_FOUND, request, response),
        );
        response.status = 404;
      }
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));

      if (e instanceof RequestError) {
        response.status = e.status;
      } else {
        response.status = 500;
      }

      const errorObj = e instanceof Error ? e : new Error(String(e));
      dispatchEvent(
        new ErrorEvent(EEvent.ROUTE_ERROR, errorObj, { response, request }),
      );
    }

    if (!context) {
      context = {
        route: route || this.api,
        di: route?.di || {},
        match: { params: {}, url, uri },
        url,
        request,
        response,
        state: new Map(),
      };
    }

    return {
      ok: !error && response.status >= 200 && response.status < 400,
      body: response.body,
      statusCode: response.status,
      headers: response.headers,
      // deno-lint-ignore no-explicit-any
      context: context as any,
      error,
    };
  }
}

export function testApi(api: Api): TestApi {
  return new TestApi(api);
}
