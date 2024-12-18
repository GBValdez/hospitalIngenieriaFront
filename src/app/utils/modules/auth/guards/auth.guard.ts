import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authSvc: AuthService) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    //   // Injeccion de dependencias
    const IS_PROTECT: number = route.data['isProtect'];
    let pass: boolean = true;
    //25 significa ruta no protegida
    //20 significa ruta protegida
    //30 significa ruta protegida para usuarios no autenticados

    if (IS_PROTECT != 25) {
      if (this.authSvc.hasAuth()) {
        if (route.data['roles'] == undefined) pass = IS_PROTECT == 20;
        else {
          const roles = route.data['roles'] as string[];
          const userRoles = this.authSvc.getAuth()!.roles;
          pass = roles.some((role) => userRoles.includes(role));
          pass = pass && IS_PROTECT == 20;
        }
      } else {
        pass = IS_PROTECT == 30;
      }
    }
    if (!pass) {
      if (IS_PROTECT == 20) this.router.navigate(['/login']);
      else this.router.navigate(['/session/dashboard']);
    }
    return pass;
  }
}
