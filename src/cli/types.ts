export interface ICliRequest {
  command: string;
  method: string;
  // deno-lint-ignore no-explicit-any
  payload?: any;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface ICliResult {
  ok: boolean;
  status: number;
  // deno-lint-ignore no-explicit-any
  body: any;
  headers: Headers;
  error?: Error;
}
