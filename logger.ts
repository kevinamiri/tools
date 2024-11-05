import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import util from 'util';


export class LoggerService {
  private logger: winston.Logger;
  private originalConsoleLog: (...data: any[]) => void;
  public colors = {
    debug: '\x1b[36m', // 🔷 Cyan
    info: '\x1b[34m',  // 🔵 Blue
    warn: '\x1b[33m',  // 🟡 Yellow
    error: '\x1b[31m', // 🔴 Red
    reset: '\x1b[0m',
    orange: '\x1b[38;5;208m',
    magenta: '\x1b[3m\x1b[35m',
    lightBlueItalic: '\x1b[3m\x1b[94m',
    lightItalicRed: '\x1b[3m\x1b[91m',
    lightItalicOrange: '\x1b[3m\x1b[38;5;215m',
    lightItalicGreen: '\x1b[3m\x1b[92m',
  };

  constructor() {
    const env = process.env.NODE_ENV || 'development';
    const logLevel = env === 'production' ? 'info' : 'debug';

    this.originalConsoleLog = console.log;
    this.logger = winston.createLogger({
      level: logLevel,
      transports: [this.consoleTransport(), this.fileTransport()],
    });

    // Optionally, avoid overriding global console methods
    // If you choose to override, ensure proper handling as shown below
    console.log = this.info.bind(this);
    console.info = this.info.bind(this);
    console.warn = this.warn.bind(this);
    console.error = this.error.bind(this);
    console.debug = this.debug.bind(this);
  }

  private consoleTransport(): winston.transport {
    return new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(this.formatConsoleMsg.bind(this))
      ),
    });
  }

  private fileTransport(): winston.transport {
    return new DailyRotateFile({
      filename: 'logs/agent-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(this.formatFileMsg.bind(this))
      ),
    });
  }


  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toISOString().replace('T', ' ').slice(0, 19);
  }

  private formatConsoleMsg({ level, message, timestamp, stack }: winston.Logform.TransformableInfo): string {
  const icon = this.getLogIcon(level);
  const colorLevel = this.colorize(level);
  const formattedTimestamp = this.formatTimestamp(timestamp);
  return `${formattedTimestamp} ${icon} ${colorLevel}: ${message}${stack ? '\n' + stack : ''}`;
}

private formatFileMsg({ level, message, timestamp, stack }: winston.Logform.TransformableInfo): string {
  const formattedTimestamp = this.formatTimestamp(timestamp);
  return `${formattedTimestamp} ${level.toUpperCase()}: ${message}${stack ? '\n' + stack : ''}`;
}


  private colorize(level: string): string {
    return `${this.colors[level] || ''}${level.toUpperCase()}${this.colors.reset}`;
  }

  private getLogIcon(level: string): string {
    const icons = { debug: '', info: '', warn: '🟠', error: '❌' };
    return icons[level] || '';
  }

  private captureTrace(): { func: string; file: string; line: string } {
    const stack = new Error().stack?.split('\n') || [];
    let relevantLine = '';
  
    for (let i = 3; i < stack.length; i++) {
      if (!stack[i].includes('node:internal/') && 
          !stack[i].includes('node:timers') &&
          !stack[i].includes('Timeout._onTimeout') &&
          !stack[i].includes('Immediate._onImmediate') &&
          !stack[i].includes('new Promise')) {
        relevantLine = stack[i];
        break;
      }
    }
  
    const match = relevantLine.match(/at (?:(\S+)\.)?(\S+) \((.+):(\d+):(\d+)\)/);
    if (match) {
      const [, className, methodName, filePath, lineNumber] = match;
      const func = className ? `${className}.${methodName}` : methodName;
      return { func, file: filePath, line: lineNumber };
    }
  
    // Fallback for anonymous functions
    const anonymousMatch = relevantLine.match(/at (.+):(\d+):(\d+)/);
    if (anonymousMatch) {
      const [, filePath, lineNumber] = anonymousMatch;
      return { func: 'anonymous', file: filePath, line: lineNumber };
    }
  
    return { func: 'Unknown', file: 'Unknown', line: 'Unknown' };
  }

  // private formatMessage(message: any, ...args: any[]): string {
  //   const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
  //   const argsStr = args.length ? ' ' + args.map(arg => JSON.stringify(arg, null, 2)).join(' ') : '';
  //   return msgStr + argsStr;
  // }
  private formatMessage(message: any, ...args: any[]): string {
    const formatObject = (obj: any): string => {
      return util.inspect(obj, { depth: null, colors: true });
    };

    let formattedMessage = typeof message === 'string' ? message : formatObject(message);
    
    if (args.length) {
      formattedMessage += ' ' + args.map(arg => 
        typeof arg === 'string' ? arg : formatObject(arg)
      ).join(' ');
    }

    return formattedMessage;
  }

  debug(message: any, ...args: any[]): void {
    const { func, file, line } = this.captureTrace();
    const msg = 
    this.logger.debug(`${this.formatMessage(message, ...args)} [Func: ${func}, 📂 ${this.colors.reset}${this.colors.lightItalicGreen}${file}:${line}${this.colors.reset}]`);
  }

  info(message: any, ...args: any[]): void {
    const { func, file, line } = this.captureTrace();
    this.logger.info(`${this.formatMessage(message, ...args)} [Func: ${func}, 📂 ${this.colors.reset}${this.colors.lightBlueItalic}${file}:${line}${this.colors.reset}]`);
  }

  warn(message: any, ...args: any[]): void {
    const { func, file, line } = this.captureTrace();
    this.logger.warn(`${this.formatMessage(message, ...args)} [Func: ${func}, 📂 ${this.colors.reset}${this.colors.lightItalicOrange}${file}:${line}${this.colors.reset}]`);
  }

  error(message: any, ...args: any[]): void {
    const { func, file, line } = this.captureTrace();
    this.logger.error(`${this.formatMessage(message, ...args)} [Func: ${func}, 📂 ${this.colors.reset}${this.colors.lightItalicRed}${file}:${line}${this.colors.reset}]`);
  }
}

// Create an instance of LoggerService
const loggerService = new LoggerService();

// Export the instance if needed
export default loggerService;
