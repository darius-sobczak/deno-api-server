import { Api } from '../services/api.ts';
import { Route } from '../services/route.ts';
import { CliApi } from './cli-api.ts';
import { parseCliArgs } from './parse-args.ts';
import { printHelp, printRouteHelp } from './help.ts';

/**
 * Main CLI entry point. Parses Deno.args, shows help or executes route.
 */
export async function runCli(api: Api): Promise<void> {
  const args = Deno.args;

  // No args or --help as first arg: show general help
  if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
    printHelp(api);
    Deno.exit(0);
  }

  const hasHelp = args.includes('--help');
  const cliReq = parseCliArgs(args);

  // <command> --help: show route-specific help
  if (hasHelp && cliReq.command) {
    const url = new URL(cliReq.command, 'http://localhost');
    const request = new Request(`${url}`, { method: cliReq.method });
    const route = api.getRouteByRequest(request, url);

    if (route) {
      printRouteHelp(route);
    } else {
      console.error(`Route not found: ${cliReq.command}`);
      Deno.exit(1);
    }
    Deno.exit(0);
  }

  // Execute route
  const cli = new CliApi(api);
  const result = await cli.execute(cliReq);

  if (result.body !== undefined) {
    const output = typeof result.body === 'string'
      ? result.body
      : JSON.stringify(result.body, null, 2);
    console.log(output);
  }

  Deno.exit(result.ok ? 0 : 1);
}
