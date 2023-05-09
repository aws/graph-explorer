declare module 'pino-socket' {
    import { Transform } from 'stream';
  
    function pinoSocket(url: string, options?: any): Transform;
    export = pinoSocket;
  }