import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
import 'moment-timezone';

@Pipe({
  name: 'localTimezonePipe',
  standalone: true,
})
export class LocalTimezonePipe implements PipeTransform {
  transform(value: string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return moment.utc(value).tz(timeZone).format(format);
  }
}
