export type IRequest = Request;

export interface IServerConfig {
  hostname?: string;
  https?: boolean;
  port: number;
}

//@ts-ignore
export interface IStateMap {
  [key: string]: any;
}

export interface IInjections {
  [key: string]: any;
}

export interface IResponse {
  status: number;
  message?: string;
  body?: any;
  headers: Headers;
}

export interface IPipeResponse {
  context: IContext;
  response: IResponse;
}

export interface IRoute {
  methods: string[];
  matcher: IMatcher;
  di: IInjections;
  parent?: any;

  isMatch(url: URL): boolean;
  addPipe(pipe: IPipe): IRoute;
  execute(
    url: URL,
    request: IRequest,
    response: IResponse,
  ): Promise<IContext>;
}

export interface IMatch {
  params: IStateMap;
  url: URL;
  uri: string;
  matches?: RegExpMatchArray | URLPatternResult;
  [key: string]: any;
}

export type IMatching = IMatch | null;

export interface IMatcher {
  readonly uri: string;
  getMatch(url: URL): IMatching;
}

export interface IContext {
  route: IRoute;
  di: IInjections;
  match: IMatch;
  url: URL;
  request: IRequest;
  response: IResponse;
  state: IStateMap;
}

export type IPipe = (context: IContext) => void | symbol | Promise<void | symbol>;

export const BreakPipe = Symbol('BreakPipe');
