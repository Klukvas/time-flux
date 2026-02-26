import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { IANAZone } from 'luxon';

export function IsIANATimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIANATimezone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return typeof value === 'string' && IANAZone.isValidZone(value);
        },
        defaultMessage(_args: ValidationArguments) {
          return 'timezone must be a valid IANA timezone (e.g. "Europe/Berlin", "UTC")';
        },
      },
    });
  };
}
