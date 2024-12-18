import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { AES, enc, SHA256 } from 'crypto-js';
import { localStorExp } from './commons.interface';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor() {}
  private KEY_EXP: string = 'expLocalStorage';
  setItem<t>(key: string, value: t, timeDay?: number): void {
    const KEY_HASH = SHA256(key).toString();
    const VALUE_ENCRYPTED = AES.encrypt(
      JSON.stringify(value),
      environment.key
    ).toString();
    this.configureExp(key, timeDay);
    localStorage.setItem(KEY_HASH, VALUE_ENCRYPTED);
  }

  getItem<t>(key: string): t | null {
    const EXP: localStorExp | undefined = this.configureExpGet(key);
    if (!EXP) return null;
    if (EXP.exp != null) {
      if (new Date() > new Date(EXP.exp)) {
        this.removeItem(key);
        return null;
      }
    }

    const KEY_HASH = SHA256(key).toString();
    const VALUE = localStorage.getItem(KEY_HASH) ?? '';
    if (VALUE.trim().length > 0 && VALUE != '') {
      const DECRYPT_TEXT: string = AES.decrypt(VALUE, environment.key).toString(
        enc.Utf8
      );
      return JSON.parse(DECRYPT_TEXT) as t;
    }
    return null;
  }

  removeItem(key: string): void {
    const KEY = SHA256(key).toString();
    localStorage.removeItem(KEY);
  }

  hasItem(key: string): boolean {
    const KEY = SHA256(key).toString();
    return localStorage.getItem(KEY) != null;
  }

  private configureExp(key: string, timeDays?: number): void {
    if (key == this.KEY_EXP) return;

    const DAY_EXP = timeDays
      ? new Date(new Date().getTime() + timeDays * 24 * 60 * 60 * 1000)
      : null;
    const NEW_KEY: localStorExp = {
      key: key,
      exp: DAY_EXP,
    };

    const VALUE: localStorExp[] =
      this.getItem<localStorExp[]>(this.KEY_EXP) ?? [];
    const INDEX = VALUE.findIndex((x) => x.key == key);
    if (INDEX != -1) {
      VALUE[INDEX] = NEW_KEY;
    } else {
      VALUE.push(NEW_KEY);
    }
    this.setItem(this.KEY_EXP, VALUE);
  }

  private configureExpGet(key: string): localStorExp | undefined {
    if (key != this.KEY_EXP) {
      const VALUE: localStorExp[] =
        this.getItem<localStorExp[]>(this.KEY_EXP) ?? [];
      return VALUE.find((x) => x.key == key);
    } else {
      return {
        key,
        exp: null,
      };
    }
  }
}
