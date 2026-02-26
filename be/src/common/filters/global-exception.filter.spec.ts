import { HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter.js';
import { AppError } from '../errors/app.error.js';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { method: string; url: string };
  let mockHost: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockRequest = { method: 'GET', url: '/api/v1/test' };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('should handle AppError with details', () => {
    const error = new AppError('CUSTOM_ERROR', HttpStatus.BAD_REQUEST, 'Something went wrong', { field: 'email' });

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error_code: 'CUSTOM_ERROR',
      message: 'Something went wrong',
      details: { field: 'email' },
    });
  });

  it('should handle AppError without details', () => {
    const error = new AppError('NOT_FOUND', HttpStatus.NOT_FOUND, 'Not found');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error_code: 'NOT_FOUND',
      message: 'Not found',
    });
  });

  it('should handle HttpException BAD_REQUEST as VALIDATION_ERROR', () => {
    const error = new HttpException(
      { message: ['email must be valid'], statusCode: 400 },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error_code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: ['email must be valid'],
    });
  });

  it('should handle HttpException UNAUTHORIZED', () => {
    const error = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error_code: 'UNAUTHORIZED',
      message: 'Unauthorized',
    });
  });

  it('should handle other HttpException as HTTP_ERROR', () => {
    const error = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error_code: 'HTTP_ERROR',
      message: 'Forbidden',
    });
  });

  it('should handle unhandled Error as 500 INTERNAL_ERROR', () => {
    const error = new Error('Unexpected crash');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error_code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  it('should handle non-Error exception as 500 INTERNAL_ERROR', () => {
    filter.catch('string error', mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error_code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  it('should handle BAD_REQUEST with object response that has no message field', () => {
    const error = new HttpException(
      { error: 'Bad Request', statusCode: 400 },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error_code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: { error: 'Bad Request', statusCode: 400 },
    });
  });
});
