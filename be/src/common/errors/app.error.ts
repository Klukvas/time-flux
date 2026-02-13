import { HttpStatus } from '@nestjs/common';

export class AppError extends Error {
  constructor(
    public readonly errorCode: string,
    public readonly statusCode: HttpStatus,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UserNotFoundError extends AppError {
  constructor() {
    super('USER_NOT_FOUND', HttpStatus.NOT_FOUND, 'User not found');
  }
}

export class EventNotFoundError extends AppError {
  constructor() {
    super('EVENT_NOT_FOUND', HttpStatus.NOT_FOUND, 'Event not found');
  }
}

export class EventAlreadyClosedError extends AppError {
  constructor() {
    super('EVENT_ALREADY_CLOSED', HttpStatus.CONFLICT, 'Event is already closed');
  }
}

export class InvalidDateRangeError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super('INVALID_DATE_RANGE', HttpStatus.BAD_REQUEST, 'start_date must be before or equal to end_date', details);
  }
}

export class CategoryNotFoundError extends AppError {
  constructor() {
    super('CATEGORY_NOT_FOUND', HttpStatus.NOT_FOUND, 'Category not found');
  }
}

export class DayStateNotFoundError extends AppError {
  constructor() {
    super('DAY_STATE_NOT_FOUND', HttpStatus.NOT_FOUND, 'Day state not found');
  }
}

export class PeriodOverlapError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(
      'PERIOD_OVERLAP',
      HttpStatus.CONFLICT,
      'Only one active period per event group is allowed',
      details,
    );
  }
}

export class CategoryInUseError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(
      'CATEGORY_IN_USE',
      HttpStatus.CONFLICT,
      'Category is used by existing chapters and cannot be deleted',
      details,
    );
  }
}

export class EventGroupNotFoundError extends AppError {
  constructor() {
    super('EVENT_GROUP_NOT_FOUND', HttpStatus.NOT_FOUND, 'Event group not found');
  }
}

export class EventGroupInUseError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(
      'EVENT_GROUP_IN_USE',
      HttpStatus.CONFLICT,
      'Event group has periods and cannot be deleted',
      details,
    );
  }
}

export class EventPeriodNotFoundError extends AppError {
  constructor() {
    super('EVENT_PERIOD_NOT_FOUND', HttpStatus.NOT_FOUND, 'Event period not found');
  }
}

export class ActivePeriodExistsError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(
      'ACTIVE_PERIOD_EXISTS',
      HttpStatus.CONFLICT,
      'Only one active period per event group is allowed',
      details,
    );
  }
}

export class DayStateInUseError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(
      'DAY_STATE_IN_USE',
      HttpStatus.CONFLICT,
      'Day state is used by existing days and cannot be deleted',
      details,
    );
  }
}

export class ValidationError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', HttpStatus.BAD_REQUEST, 'Validation failed', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', HttpStatus.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', HttpStatus.FORBIDDEN, message);
  }
}

export class DayNotFoundError extends AppError {
  constructor() {
    super('DAY_NOT_FOUND', HttpStatus.NOT_FOUND, 'Day not found');
  }
}

export class MediaNotFoundError extends AppError {
  constructor() {
    super('MEDIA_NOT_FOUND', HttpStatus.NOT_FOUND, 'Media not found');
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super('INVALID_FILE_TYPE', HttpStatus.BAD_REQUEST, 'File type is not allowed', details);
  }
}

export class FileTooLargeError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super('FILE_TOO_LARGE', HttpStatus.BAD_REQUEST, 'File exceeds the maximum allowed size', details);
  }
}

export class FutureDateError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super('FUTURE_DATE', HttpStatus.BAD_REQUEST, 'Cannot create or modify entries for dates more than one day in the future', details);
  }
}

export class RecommendationNotFoundError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super('RECOMMENDATION_NOT_FOUND', HttpStatus.BAD_REQUEST, 'Unknown recommendation key', details);
  }
}

export class GoogleAuthFailedError extends AppError {
  constructor(message = 'Google authentication failed') {
    super('GOOGLE_AUTH_FAILED', HttpStatus.UNAUTHORIZED, message);
  }
}

export class UserCreationFailedError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super('USER_CREATION_FAILED', HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to create user account', details);
  }
}

export class InternalError extends AppError {
  constructor() {
    super('INTERNAL_ERROR', HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
}
