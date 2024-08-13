import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export class LoggerService {
  private logger: winston.Logger;
  public colors = {
    debug: '\x1b[36m', // 🔷 Cyan
    info: '\x1b[34m',  // 🔵 Blue
    warn: '\x1b[33m',  // 🟡 Yellow
    error: '\x1b[31m', // 🔴 Red
    reset: '\x1b[0m',
    orange: '\x1b[38;5;208m',
    magenta: '\x1b[3m\x1b[35m',
    lightBlueItalic: '\x1b[3m\x1b[94m',
    lightItalicRed: '\x1b[3m\x1b[91m',    // New light italic red
    lightItalicOrange: '\x1b[3m\x1b[38;5;215m', // New light italic orange
    lightItalicGreen: '\x1b[3m\x1b[92m',  // New light italic green
  };


  constructor() {
    const env = process.env.NODE_ENV || 'development';
    const logLevel = env === 'production' ? 'info' : 'debug';

    this.logger = winston.createLogger({
      level: logLevel,
      transports: [this.consoleTransport(), this.fileTransport()],
    });
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



  private formatConsoleMsg({ level, message, timestamp, stack }: winston.Logform.TransformableInfo): string {
    const icon = this.getLogIcon(level);
    const colorLevel = this.colorize(level);
    return `${timestamp} ${icon} ${colorLevel}: ${message}${stack ? '\n' + stack : ''}`;
  }

  private formatFileMsg({ level, message, timestamp, stack }: winston.Logform.TransformableInfo): string {
    return `${timestamp} ${level.toUpperCase()}: ${message}${stack ? '\n' + stack : ''}`;
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

  debug(message: string): void {
    const { func, file, line } = this.captureTrace();
    this.logger.debug(`${message} [Func: ${func}, 📂 ${this.colors.reset}${this.colors.lightItalicGreen}${file}:${line}${this.colors.reset}]`);
  }

  info(message: string): void {
    const { func, file, line } = this.captureTrace();
    this.logger.info(`${message} [Func: ${func}, 📂 ${this.colors.reset}${this.colors.lightBlueItalic}${file}:${line}${this.colors.reset}]`);
  }

  warn(message: string): void {
    const { func, file, line } = this.captureTrace();
    this.logger.warn(`${message} [Func: ${func}, 📂 ${this.colors.reset}${this.colors.lightItalicOrange}${file}:${line}${this.colors.reset}]`);
  }

  error(message: string, error?: Error): void {
    const { func, file, line } = this.captureTrace();
    this.logger.error(`${message} [Func: ${func}, 📂 ${this.colors.reset}${this.colors.lightItalicRed}${file}:${line}${this.colors.reset}]`, { error });
  }
}




class LoggerServiceTester {
  private logger: LoggerService;

  constructor() {
    this.logger = new LoggerService();
  }

  testBasicLogs() {
    console.log('Testing basic log levels:');
    this.logger.debug('Debug message');
    this.logger.info('Info message');
    this.logger.warn('Warning message');
    this.logger.error('Error message', new Error('Test error'));
  }

  testNestedFunction() {
    console.log('\nTesting nested function for stack trace:');
    const nestedFunction = () => {
      this.logger.info('Nested function info');
      this.logger.error('Nested function error');
    };
    nestedFunction();
  }

  // @see {@link LoggerServiceTester.testAsyncFunction}
  async testAsyncFunction() {
    console.log('\nTesting async function:');
    await this.delayedLog();
  }

  private async delayedLog(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.logger.info('Async function info');
    this.logger.error('Async function error');
  }


  async runAllTests() {
    this.testBasicLogs();
    this.testNestedFunction();
    await this.testAsyncFunction();
    console.log('\nTests completed. Check the logs folder for file output.');
  }
}

// Run the tests
const tester = new LoggerServiceTester();
tester.runAllTests();
