import { createLogger, setLogLevel, getLogLevel, LogLevel } from '../utils/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    // Reset log level to default
    setLogLevel('INFO');
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('createLogger', () => {
    it('should create a logger with the specified context', () => {
      const logger = createLogger('TestContext');
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('[TestContext]'),
        'Test message'
      );
    });

    it('should format log messages with timestamp', () => {
      const logger = createLogger('TestContext');
      logger.info('Test message');

      const logCall = consoleLogSpy.mock.calls[0][0];
      // Check timestamp format YYYY-MM-DD HH:mm:ss.SSS
      expect(logCall).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/);
    });
  });

  describe('Log Levels', () => {
    it('should respect DEBUG log level', () => {
      setLogLevel('DEBUG');
      const logger = createLogger('Test');

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug and info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });

    it('should respect INFO log level', () => {
      setLogLevel('INFO');
      const logger = createLogger('Test');

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // info only
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });

    it('should respect WARN log level', () => {
      setLogLevel('WARN');
      const logger = createLogger('Test');

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });

    it('should respect ERROR log level', () => {
      setLogLevel('ERROR');
      const logger = createLogger('Test');

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error only
    });

    it('should handle NONE log level', () => {
      setLogLevel('NONE');
      const logger = createLogger('Test');

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Log Level Configuration', () => {
    it('should read log level from environment variable', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      // Re-import to pick up env var
      jest.resetModules();
      const { getLogLevel: getNewLogLevel } = require('../utils/logger');
      
      expect(getNewLogLevel()).toBe('DEBUG');
    });

    it('should default to INFO if no env var set', () => {
      delete process.env.LOG_LEVEL;
      jest.resetModules();
      const { getLogLevel: getNewLogLevel } = require('../utils/logger');
      
      expect(getNewLogLevel()).toBe('INFO');
    });

    it('should handle invalid log level in env var', () => {
      process.env.LOG_LEVEL = 'INVALID';
      jest.resetModules();
      const { getLogLevel: getNewLogLevel } = require('../utils/logger');
      
      expect(getNewLogLevel()).toBe('INFO'); // Should default to INFO
    });
  });

  describe('Sensitive Data Redaction', () => {
    it('should redact tokens in log messages', () => {
      const logger = createLogger('Security');
      logger.info('Token: qb-token-12345678');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'Token: qb-token-[REDACTED]'
      );
    });

    it('should redact tokens in objects', () => {
      const logger = createLogger('Security');
      logger.info('Config:', { token: 'qb-token-secret123', name: 'test' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'Config:',
        { token: '[REDACTED]', name: 'test' }
      );
    });

    it('should redact userToken in objects', () => {
      const logger = createLogger('Security');
      logger.info('Auth:', { userToken: 'my-secret-token', realm: 'test' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'Auth:',
        { userToken: '[REDACTED]', realm: 'test' }
      );
    });

    it('should redact nested sensitive data', () => {
      const logger = createLogger('Security');
      logger.info('Deep config:', {
        auth: {
          credentials: {
            token: 'secret-token',
            userToken: 'user-secret'
          }
        }
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'Deep config:',
        {
          auth: {
            credentials: {
              token: '[REDACTED]',
              userToken: '[REDACTED]'
            }
          }
        }
      );
    });

    it('should handle arrays with sensitive data', () => {
      const logger = createLogger('Security');
      logger.info('Tokens:', [
        { token: 'secret1' },
        { token: 'secret2' },
        { name: 'public' }
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'Tokens:',
        [
          { token: '[REDACTED]' },
          { token: '[REDACTED]' },
          { name: 'public' }
        ]
      );
    });
  });

  describe('Error Logging', () => {
    it('should log errors with stack traces', () => {
      const logger = createLogger('ErrorTest');
      const error = new Error('Test error');
      logger.error('Something went wrong', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('[ErrorTest]'),
        'Something went wrong',
        error
      );
    });

    it('should handle error objects in data', () => {
      const logger = createLogger('ErrorTest');
      const error = new Error('Test error');
      logger.error('Failed operation', { error, operation: 'test' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('[ErrorTest]'),
        'Failed operation',
        { error, operation: 'test' }
      );
    });
  });

  describe('getLogLevel and setLogLevel', () => {
    it('should get and set log levels correctly', () => {
      expect(getLogLevel()).toBe('INFO'); // Default

      setLogLevel('DEBUG');
      expect(getLogLevel()).toBe('DEBUG');

      setLogLevel('ERROR');
      expect(getLogLevel()).toBe('ERROR');
    });

    it('should handle case-insensitive log levels', () => {
      setLogLevel('debug' as LogLevel);
      expect(getLogLevel()).toBe('DEBUG');

      setLogLevel('WaRn' as LogLevel);
      expect(getLogLevel()).toBe('WARN');
    });
  });
});