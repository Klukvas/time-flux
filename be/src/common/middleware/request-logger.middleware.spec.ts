import { RequestLoggerMiddleware } from './request-logger.middleware.js';

describe('RequestLoggerMiddleware', () => {
  let middleware: RequestLoggerMiddleware;
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;
  let finishHandler: () => void;

  beforeEach(() => {
    middleware = new RequestLoggerMiddleware();
    mockReq = { method: 'GET', originalUrl: '/api/v1/test' };
    mockRes = {
      statusCode: 200,
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') finishHandler = handler;
      }),
    };
    mockNext = jest.fn();
  });

  it('should call next()', () => {
    middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should register a finish event listener', () => {
    middleware.use(mockReq, mockRes, mockNext);

    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should log on response finish for 2xx status', () => {
    middleware.use(mockReq, mockRes, mockNext);
    mockRes.statusCode = 200;

    // Trigger the finish handler — no errors expected
    expect(() => finishHandler()).not.toThrow();
  });

  it('should not throw for 4xx status', () => {
    middleware.use(mockReq, mockRes, mockNext);
    mockRes.statusCode = 404;

    expect(() => finishHandler()).not.toThrow();
  });

  it('should not throw for 5xx status', () => {
    middleware.use(mockReq, mockRes, mockNext);
    mockRes.statusCode = 500;

    expect(() => finishHandler()).not.toThrow();
  });
});
