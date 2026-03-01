import { ICliRequest } from './types.ts';

/**
 * Parse CLI arguments into a structured request descriptor.
 *
 * First positional arg is the command (route path).
 * Flags: --method/-m, --payload/-p, --header/-H
 * Query params extracted from ?key=val in the command string.
 */
export function parseCliArgs(args: string[]): ICliRequest {
  let command = '';
  let method = '';
  // deno-lint-ignore no-explicit-any
  let payload: any = undefined;
  const headers: Record<string, string> = {};
  let foundCommand = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--method' || arg === '-m') {
      method = (args[++i] ?? '').toUpperCase();
    } else if (arg === '--payload' || arg === '-p') {
      const raw = args[++i] ?? '';
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = raw;
      }
    } else if (arg === '--header' || arg === '-H') {
      const val = args[++i] ?? '';
      const colonIdx = val.indexOf(':');
      if (colonIdx > 0) {
        headers[val.slice(0, colonIdx).trim()] = val.slice(colonIdx + 1).trim();
      }
    } else if (arg === '--help') {
      // pass through, handled by runCli
    } else if (!foundCommand && !arg.startsWith('-')) {
      command = arg;
      foundCommand = true;
    }
  }

  // Extract query params from command string
  const params: Record<string, string> = {};
  const qIdx = command.indexOf('?');
  if (qIdx >= 0) {
    const queryString = command.slice(qIdx + 1);
    command = command.slice(0, qIdx);
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams) {
      params[key] = value;
    }
  }

  // Ensure leading slash
  if (command && !command.startsWith('/')) {
    command = '/' + command;
  }

  // Auto-detect method: POST if payload present, otherwise GET
  if (!method) {
    method = payload !== undefined ? 'POST' : 'GET';
  }

  const result: ICliRequest = { command, method };
  if (payload !== undefined) result.payload = payload;
  if (Object.keys(params).length > 0) result.params = params;
  if (Object.keys(headers).length > 0) result.headers = headers;

  return result;
}
