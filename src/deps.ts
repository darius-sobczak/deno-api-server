export const serve = (handler: (req: Request) => Response | Promise<Response>, options: { port: number; hostname?: string }) =>
  Deno.serve(options, handler).finished;
