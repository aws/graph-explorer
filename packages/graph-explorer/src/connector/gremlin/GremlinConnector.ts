import type {
  KeywordSearchRequest,
  KeywordSearchResponse,
  NeighborsCountRequest,
  NeighborsCountResponse,
  NeighborsRequest,
  NeighborsResponse,
  QueryOptions,
  SchemaResponse,
} from "../AbstractConnector";
import { AbstractConnector } from "../AbstractConnector";
import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchSchema from "./queries/fetchSchema";
import keywordSearch from "./queries/keywordSearch";
import pino from "pino";
import pinoSocket from "pino-socket";
import { Transform, TransformCallback } from "stream";

const logger = pino({
  level: 'debug',
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME,
    app: 'my-app'
  }
});

const socket = pinoSocket('http://18.232.47.207:3000');
// create a custom logger transform that extends the Transform stream and logs messages to the pino logger
class LoggerTransform extends Transform {
  private logger: pino.Logger;

  constructor(logger: pino.Logger) {
    super({ objectMode: true });
    this.logger = logger;
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback) {
    const message = chunk.toString();
    this.logger.info(message);
    callback();
  }
}

// create an instance of the LoggerTransform and pipe the socket to it
const loggerTransform = new LoggerTransform(logger);
socket.pipe(loggerTransform);

// log a message to the socket
socket.write('Hello, world!');

export default class GremlinConnector extends AbstractConnector {
  protected readonly basePath = "/?gremlin=";


  fetchSchema(options?: QueryOptions): Promise<SchemaResponse> {
    const logger = pino({
      level: 'info',
      prettyPrint: true,
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
    }, pino.destination('./logs/app.log'));
    logger.info("hello");
    return fetchSchema(this._gremlinFetch(options));
  }

  fetchNeighbors(
    req: NeighborsRequest,
    options: QueryOptions | undefined
  ): Promise<NeighborsResponse> {
    return fetchNeighbors(this._gremlinFetch(options), req);
  }

  fetchNeighborsCount(
    req: NeighborsCountRequest,
    options?: QueryOptions
  ): Promise<NeighborsCountResponse> {
    return fetchNeighborsCount(this._gremlinFetch(options), req);
  }

  keywordSearch(
    req: KeywordSearchRequest,
    options?: QueryOptions
  ): Promise<KeywordSearchResponse> {
    return keywordSearch(this._gremlinFetch(options), req);
  }

  private _gremlinFetch<TResult>(options?: QueryOptions) {
    return async (queryTemplate: string) => {
      return super.request<TResult>(queryTemplate, {
        signal: options?.abortSignal,
      });
    };
  }
}
