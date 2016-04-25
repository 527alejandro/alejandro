import {print} from '@angular/facade';
import {Injectable} from './di/decorators';

@Injectable()
export class Console {
  log(message: string): void { print(message); }
}
