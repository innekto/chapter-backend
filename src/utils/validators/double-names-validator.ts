import { namesValidator } from 'src/helpers/regex/names-regexp';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'IsValidName', async: false })
export class IsValidName implements ValidatorConstraintInterface {
  validate(name: string) {
    if (
      name.startsWith("'") ||
      name.endsWith("'") ||
      name.split("'").length > 3
    ) {
      return false;
    }

    const nameParts = name.split('-');
    if (nameParts.length === 2) {
      return nameParts.every((part) => {
        if (part.split("'").length > 2 || !namesValidator.test(part)) {
          return false;
        }
        return true;
      });
    }

    return true;
  }
}
