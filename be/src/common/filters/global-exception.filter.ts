import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppError } from '../errors/app.error.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof AppError) {
      this.logger.warn(
        `${request.method} ${request.url} → ${exception.statusCode} ${exception.errorCode}: ${exception.message}`,
      );
      response.status(exception.statusCode).json({
        error_code: exception.errorCode,
        message: exception.message,
        ...(exception.details ? { details: exception.details } : {}),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      this.logger.warn(
        `${request.method} ${request.url} → ${status}: ${exception.message}`,
      );

      if (status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        response.status(status).json({
          error_code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: resp.message ?? resp,
        });
        return;
      }

      if (status === HttpStatus.UNAUTHORIZED) {
        response.status(status).json({
          error_code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });
        return;
      }

      response.status(status).json({
        error_code: 'HTTP_ERROR',
        message: exception.message,
      });
      return;
    }

    // Unhandled exceptions — log the full error
    this.logger.error(
      `${request.method} ${request.url} → 500 Unhandled Exception`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error_code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
}
