import { Api } from '../services/api.ts';
import { IRoute } from '../definition/types.ts';
import { Route } from '../services/route.ts';

/**
 * Print help listing all registered routes.
 */
export function printHelp(api: Api): void {
  console.log('Available routes:\n');

  if (api.routes.length === 0) {
    console.log('  (no routes registered)');
    return;
  }

  for (const route of api.routes) {
    const methods = route.methods.join(',');
    const uri = route.matcher.uri;
    const description = getRouteDescription(route);
    const desc = description ? ` — ${description}` : '';
    console.log(`  ${methods} ${uri}${desc}`);
  }

  console.log('\nUsage: <command> [options]');
  console.log('  --method, -m    HTTP method (default: GET, POST if payload)');
  console.log('  --payload, -p   JSON payload');
  console.log('  --header, -H    Header as "Key: Value" (repeatable)');
  console.log('  --help          Show help');
}

/**
 * Print detailed help for a single route.
 */
export function printRouteHelp(route: IRoute): void {
  const methods = route.methods.join(',');
  const uri = route.matcher.uri;
  console.log(`\n  ${methods} ${uri}`);

  const r = route as Route;
  if (r.props) {
    const cli = r.props.get('cli') as { description?: string; examples?: string[] } | undefined;
    const swagger = r.props.get('swagger') as { summary?: string; description?: string } | undefined;

    const description = cli?.description ?? swagger?.description ?? swagger?.summary;
    if (description) {
      console.log(`\n  ${description}`);
    }

    if (cli?.examples?.length) {
      console.log('\n  Examples:');
      for (const example of cli.examples) {
        console.log(`    ${example}`);
      }
    }
  }
}

function getRouteDescription(route: IRoute): string {
  const r = route as Route;
  if (!r.props) return '';

  const cli = r.props.get('cli') as { description?: string } | undefined;
  if (cli?.description) return cli.description;

  const swagger = r.props.get('swagger') as { summary?: string; description?: string } | undefined;
  return swagger?.summary ?? swagger?.description ?? '';
}
