const GLOBALS = Object.create(null);

function defineGlobals() {
  const defineProperty = (obj: any) => {
    if (obj && !Object.prototype.hasOwnProperty.call(obj, 'powership')) {
      Object.defineProperty(obj, 'powership', {
        configurable: false,
        enumerable: true,
        get: () => GLOBALS,
      });
    }
  };

  try {
    if (typeof globalThis !== 'undefined') defineProperty(globalThis);
  } catch (e) {}

  try {
    if (typeof global !== 'undefined') defineProperty(global);
  } catch (e) {}

  try {
    if (typeof window !== 'undefined') defineProperty(window);
  } catch (e) {}
}
defineGlobals();

export * from '@powership/schema';
export * from '@powership/utils';
export * from 'plugin-engine';

// @only-server
export * from '@powership/entity';
// @only-server
export * from '@powership/transporter';

// @only-server
export type { RootFilterOperators } from '@powership/transporter';

// @only-server
export * from '@powership/server';

// @only-server
export {
  BaseRequest,
  BaseRequestHandler,
  Server,
  ServerResponse,
  ServerRequest,
  UnhandledSymbol,
  HttpError,
  NotImplementedError,
  ServerLogs,
} from '@powership/server';

// @only-server
export type {
  Handler,
  RouteHandlerCallback,
  CloseResponseFunction,
  GraphQLDataResponse,
  GraphQLResponseRecord,
  BaseRequestHandlerInit,
  _GraphQLDataBasic,
  ServerServerInfo,
  ServerResponseStatus,
  ServerHooksRecord,
  ServerHooks,
  RequestBody,
  ServerResponseInit,
  ServerStartResult,
  ServerDefinition,
  HeaderNamed,
  ServerRequestInit,
  HeaderRecord,
  HTTPHandlerParsed,
  RouteHandlerContext,
  HeaderRecordInit,
} from '@powership/server';
