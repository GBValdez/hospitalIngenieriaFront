import { Inject, Injectable, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { authUserInterface } from '@auth/interface/auth.inteface';
import { environment } from '@env/environment';
import { LocalStorageService } from '@utils/local-storage.service';
import { AES, enc } from 'crypto-js';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    // private cookiesSvc: CookieService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private localStorageSvc: LocalStorageService
  ) {}
  authObs: BehaviorSubject<authUserInterface | null> =
    new BehaviorSubject<authUserInterface | null>(null);

  getObservable(): Observable<authUserInterface | null> {
    return this.authObs.asObservable();
  }
  nextAuth(auth: authUserInterface | null) {
    this.authObs.next(auth);
  }

  hasAuth(): boolean {
    return this.localStorageSvc.hasItem('auth');
  }

  setAuth(newAuth: authUserInterface) {
    this.localStorageSvc.setItem('auth', newAuth, 1);
    this.authObs.next(newAuth);
  }
  getAuth(): authUserInterface | null {
    return this.localStorageSvc.getItem('auth');
  }
  logout() {
    this.localStorageSvc.removeItem('auth');
    this.authObs.next(null);
    this.router.navigate(['/login']);
  }
  hasRoles(roles: string[]): boolean {
    const auth = this.getAuth();
    if (!auth) {
      return false;
    }
    return roles.some((role) => auth.roles.includes(role));
  }
}
