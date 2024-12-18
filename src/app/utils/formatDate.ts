import { MAT_DATE_FORMATS } from '@angular/material/core';
import moment from 'moment';

export const APP_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export const APP_DATE_FORMATS_PROVIDER = {
  provide: MAT_DATE_FORMATS,
  useValue: APP_DATE_FORMATS,
};

export const convertMomentToDate = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Si el objeto es un objeto moment, conviértelo a Date
  if (moment.isMoment(obj)) {
    return obj.toDate();
  }

  // Si es un Array, aplica la función a cada uno de sus elementos
  if (Array.isArray(obj)) {
    return obj.map(convertMomentToDate);
  }

  // Si es un objeto, aplica la función recursivamente a cada una de sus propiedades
  const convertedObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      convertedObj[key] = convertMomentToDate(obj[key]);
    }
  }

  return convertedObj;
};
