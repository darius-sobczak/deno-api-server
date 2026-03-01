import { IContext, IInjections, IPipe } from '../definition/types.ts';
import { Route } from '../services/route.ts';
import { RequestError } from '../errors/request.error.ts';
import { mockRequest } from './mock-request.ts';
import { mockResponse } from './mock-response.ts';

export interface ITestResult {
  ok: boolean;
  // deno-lint-ignore no-explicit-any
  body: any;
  statusCode: number;
  headers: Headers;
  context: IContext;
  error?: Error;
}

export interface IRequestOptions {
  uri?: string;
  // deno-lint-ignore no-explicit-any
  body?: any;
  headers?: Record<string, string> | Headers;
  params?: Record<string, string>;
}

export class TestRoute {
  private route: Route;
  private mocks: Map<number, IPipe | null> = new Map();
  private diOverrides: IInjections = {};

  constructor(route: Route) {
    this.route = route;
  }

  /**
   * Mock a pipe by index.
   * Without fn: pipe becomes a no-op (skipped).
   * With fn: pipe is replaced by fn for the request.
   */
  mock(pipeIndex: number, fn?: IPipe): TestRoute {
    this.mocks.set(pipeIndex, fn ?? null);
    return this;
  }

  /**
   * Override DI services for the request.
   */
  inject(di: IInjections): TestRoute {
    this.diOverrides = { ...this.diOverrides, ...di };
    return this;
  }

  async request(method: string, options?: IRequestOptions): Promise<ITestResult> {
    const uri = options?.uri ?? this.route.matcher.uri;
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

    // Save originals
    const savedPipes = [...this.route.pipes];
    const savedDi = { ...this.route.di };

    // Apply pipe mocks
    if (this.mocks.size > 0) {
      const effective: IPipe[] = savedPipes.map((pipe, i) => {
        if (this.mocks.has(i)) {
          const mockFn = this.mocks.get(i);
          return mockFn ?? (() => {});
        }
        return pipe;
      });
      this.route.pipes.length = 0;
      for (const p of effective) this.route.pipes.push(p);
    }

    // Apply DI overrides
    if (Object.keys(this.diOverrides).length > 0) {
      this.route.di = { ...savedDi, ...this.diOverrides };
    }

    let context: IContext | undefined;
    let error: Error | undefined;

    try {
      context = await this.route.execute(url, request, response);
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
      if (e instanceof RequestError) {
        response.status = e.status;
      } else {
        response.status = 500;
      }
    } finally {
      // Restore originals
      this.route.pipes.length = 0;
      for (const p of savedPipes) this.route.pipes.push(p);
      this.route.di = savedDi;
    }

    if (!context) {
      context = {
        route: this.route,
        di: this.route.di,
        match: { params: {}, url, uri },
        url,
        request,
        response,
        state: new Map(),
      } as IContext;
    }

    return {
      ok: !error && response.status >= 200 && response.status < 400,
      body: response.body,
      statusCode: response.status,
      headers: response.headers,
      context,
      error,
    };
  }
}

export function testRoute(route: Route): TestRoute {
  return new TestRoute(route);
}
