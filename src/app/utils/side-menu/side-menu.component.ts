import {
  Component,
  OnInit,
  Input,
  HostListener,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  clickType,
  sideMenuInterface,
  sideMenuInterfaceInternal,
} from './side-menu.interface';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { NgClass } from '@angular/common';
import { SubLevelComponent } from './components/sub-level/sub-level.component';
import { AuthService } from '@auth/services/auth.service';
@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css'],
  standalone: true,
  imports: [NgClass, RouterModule, SubLevelComponent],
})
export class SideMenuComponent implements OnInit {
  timeOut: any;

  //Esto función abre el menu
  noCollapseMenu() {
    this.collapse.next(false);
    this.collapseEvent.emit(false);

    this.timeOut = setTimeout(() => {
      this.showElements.next(true);
      // clearTimeout(this.timeoutExit);
    }, 150);
  }

  // Esto función cierra el menu
  collapseMenu() {
    this.collapse.next(true);
    this.showElements.next(false);
    this.collapseEvent.emit(true);
    // Detenemos el timer muestra los elementos del menu
    clearTimeout(this.timeOut);
  }

  start() {}

  // Creamos un sujeto que visualizara si se van a mostrar los elementos del menu
  showElements: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  // Creamos la variable que dirá si se van a mostrar los elementos del menu
  showElementsValue!: boolean;

  // Creamos un sujeto que visualizara si se va a colapsar el menu
  collapse: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  // Creamos una variable que dice si el menu esta colapsado
  collapseValue!: boolean;

  // Creamos un evento que le dirá al padre si el menu esta colapsado
  @Output() collapseEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  // Recibimos la lista de opciones que tendrá nuestro sideMenu
  @Input() buttons: sideMenuInterface[] = [];

  //Extras
  gmail?: string;
  constructor(
    private elementRef: ElementRef,
    private route: Router,
    private authSvc: AuthService
  ) {}

  ngOnInit(): void {
    this.authSvc.authObs.subscribe((res) => {
      if (res) this.gmail = res.email;
      else this.gmail = undefined;
    });
    // Suscribimos los valores de los sujetos
    this.showElements.subscribe((show) => {
      this.showElementsValue = show;
    });

    this.collapse.subscribe((collapse) => {
      this.collapseValue = collapse;
    });

    // Esta funcion sirve para saber en que vista estamos , haci pintamos el botón que corresponde
    this.route.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route: ActivatedRoute = this.route.routerState.root;
          let idRoute: string = '';
          while (route!.firstChild) {
            route = route.firstChild;
          }
          if (route.snapshot.data['idRoute']) {
            idRoute = route!.snapshot.data['idRoute'];
          }
          return idRoute;
        })
      )
      .subscribe((idRoute) => {
        this.routesActive.forEach((route) => (route.present = false));
        this.buttons.some((button) => {
          return this.tourChildren(button);
        });
      });
  }
  routesActive: sideMenuInterfaceInternal[] = [];
  getObsColapse(): Observable<boolean> {
    return this.collapse.asObservable();
  }
  getObsShowElements(): Observable<boolean> {
    return this.showElements.asObservable();
  }
  tourChildren(route: sideMenuInterfaceInternal) {
    route.present = false;
    if (route.child) {
      route.present = route.child.some((item) => this.tourChildren(item));
      if (route.present) this.routesActive = [...this.routesActive, route];
      return route.present;
    } else {
      if (typeof route.click == 'string') {
        const condition: boolean = route.click == this.route.url;
        route.present = condition;
        if (route.present) this.routesActive = [...this.routesActive, route];
        return condition;
      }
      return false;
    }
  }
}
