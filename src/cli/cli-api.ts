import { Api } from '../services/api.ts';
import { IResponse } from '../definition/types.ts';
import { RequestError } from '../errors/request.error.ts';
import { EEvent } from '../definition/event.ts';
import RequestEvent from '../definition/events/request.event.ts';
import RouteEvent from '../definition/events/route.event.ts';
import ErrorEvent from '../definition/events/error.event.ts';
import { ICliRequest, ICliResult } from './types.ts';

function createRequest(cliReq: ICliRequest): Request {
  const headers = new Headers();
  // deno-lint-ignore no-explicit-any
  let body: any;

  if (cliReq.payload !== undefined) {
    const data = typeof cliReq.payload === 'object'
      ? JSON.stringify(cliReq.payload)
      : String(cliReq.payload);
    headers.set('content-type', 'application/json');
    headers.set('content-length', `${data.length}`);
    body = data;
  }

  if (cliReq.headers) {
    for (const [key, value] of Object.entries(cliReq.headers)) {
      headers.set(key, value);
    }
  }

  const url = new URL(cliReq.command, 'http://localhost');
  return new Request(`${url}`, {
    method: cliReq.method,
    headers,
    body,
  });
}

function createResponse(): IResponse {
  return { status: 200, headers: new Headers() };
}

export class CliApi {
  private api: Api;

  constructor(api: Api) {
    this.api = api;
  }

  async execute(cliReq: ICliRequest): Promise<ICliResult> {
    const request = createRequest(cliReq);
    const response = createResponse();
    const url = new URL(cliReq.command, 'http://localhost');

    // Apply search params
    if (cliReq.params) {
      for (const [key, value] of Object.entries(cliReq.params)) {
        url.searchParams.set(key, value);
      }
    }

    const route = this.api.getRouteByRequest(request, url);

    let error: Error | undefined;

    try {
      dispatchEvent(new RequestEvent(EEvent.BEFORE_REQUEST, request, response));

      if (route) {
        dispatchEvent(new RouteEvent(EEvent.BEFORE_ROUTE, route));
        const context = await route.execute(url, request, response);
        Object.assign(response, context.response);
        dispatchEvent(new RequestEvent(EEvent.AFTER_ROUTE_RESPONSE, request, response));
      } else {
        dispatchEvent(new RequestEvent(EEvent.ROUTE_NOT_FOUND, request, response));
        response.status = 404;
      }
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));

      if (e instanceof RequestError) {
        response.status = e.status;
      } else {
        response.status = 500;
      }

      dispatchEvent(
        new ErrorEvent(EEvent.ROUTE_ERROR, error, { response, request }),
      );
    }

    return {
      ok: !error && response.status >= 200 && response.status < 400,
      status: response.status,
      body: response.body,
      headers: response.headers,
      error,
    };
  }
}
