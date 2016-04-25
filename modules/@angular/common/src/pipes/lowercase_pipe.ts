import {Injectable, PipeTransform, WrappedValue, Pipe} from '@angular/core';
import {isString, CONST, isBlank} from '@angular/facade';
import {InvalidPipeArgumentException} from './invalid_pipe_argument_exception';

/**
 * Transforms text to lowercase.
 *
 * ### Example
 *
 * {@example core/pipes/ts/lowerupper_pipe/lowerupper_pipe_example.ts region='LowerUpperPipe'}
 */
@CONST()
@Pipe({name: 'lowercase'})
@Injectable()
export class LowerCasePipe implements PipeTransform {
  transform(value: string, args: any[] = null): string {
    if (isBlank(value)) return value;
    if (!isString(value)) {
      throw new InvalidPipeArgumentException(LowerCasePipe, value);
    }
    return value.toLowerCase();
  }
}
