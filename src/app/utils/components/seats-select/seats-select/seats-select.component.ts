import { NgClass, NgStyle } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  signal,
  SimpleChanges,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { SelctFinishModalComponent } from '@buyTicket/components/selct-finish-modal/selct-finish-modal.component';
import {
  selectVueloDto,
  vueloClaseDto,
} from '@buyTicket/interfaces/vuelo.interface';
import { VueloService } from '@buyTicket/services/vuelo.service';
import { HttpClient } from '@microsoft/signalr';
import {
  seatPosInterface,
  posInterface,
  mySeatPosInterface,
  modalFinishSeatInterface,
  configSeatPlane,
} from '@plane/interfaces/plane.interface';
import { boletoDto } from '@plane/interfaces/seats.interface';
import { PlaneService } from '@plane/services/plane.service';
import { SeatsService } from '@plane/services/seats.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-seats-select',
  standalone: true,
  imports: [
    NgClass,
    MatIconModule,
    MatButtonModule,
    NgStyle,
    MatTooltipModule,
    MatCheckboxModule,
    FormsModule,
    SelctFinishModalComponent,
    MatMenuModule,
  ],
  templateUrl: './seats-select.component.html',
  styleUrl: './seats-select.component.scss',
})
export class SeatsSelectComponent implements AfterViewInit, OnChanges {
  @Input() config?: configSeatPlane;
  @Input() seats: seatPosInterface[] = [];

  @Output() clickSeat: EventEmitter<seatPosInterface> =
    new EventEmitter<seatPosInterface>();

  @ViewChild('container') container!: ElementRef<HTMLDivElement>;
  wScreen: number = window.innerWidth;
  hScreen: number = window.innerHeight;
  zoom: WritableSignal<number> = signal(1);
  translatePos: posInterface = { x: 0, y: 0 };
  sizePixelSize: number = 10;
  closeSidenav: boolean = false;
  timeOutSize: any;
  posOrigin?: posInterface;
  keepClicking: boolean = false;

  constructor(private planeService: PlaneService) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.resizeFull();
    }
  }

  showToolTipText(seat: seatPosInterface): string {
    if (this.config!.showTooltipText) return this.config!.showTooltipText(seat);
    return seat.Codigo!;
  }

  blockSeat(seat: seatPosInterface): boolean {
    if (this.config!.blockSeat) {
      if (typeof this.config!.blockSeat === 'function')
        return this.config!.blockSeat(seat);
      return this.config!.blockSeat;
    }
    return false;
  }

  sendSeat(seat: seatPosInterface) {
    this.clickSeat.emit(seat);
  }
  getIcon(seat: seatPosInterface): string {
    if (this.config?.getIcon) {
      if (typeof this.config.getIcon === 'function')
        return this.config.getIcon(seat);
      return this.config.getIcon;
    }
    return '';
  }

  getOpacity(seat: seatPosInterface): number {
    if (this.config!.opacitySeat) return this.config!.opacitySeat(seat);
    return 1;
  }

  ngAfterViewInit(): void {
    if (!this.config) return;
    this.resizeFull();
  }

  resizePlane() {
    this.wScreen = window.innerWidth;
    this.hScreen = window.innerHeight;
  }
  refresh() {
    this.zoom.set(1);
    this.translatePos = { x: 0, y: 0 };
  }

  //Presionar
  pressTouch(event: TouchEvent) {
    event.preventDefault();
    this.startInteraction(event.touches[0]);
  }

  pressClick(event: MouseEvent) {
    if (event.button == 0) this.startInteraction(event);
  }

  startInteraction(event: MouseEvent | Touch): void {
    this.keepClicking = true;
    this.navigationStart(event);
  }
  navigationStart(event: MouseEvent | Touch) {
    this.posOrigin = this.setPosition(event);
  }

  //Mover
  touchMove(event: TouchEvent) {
    if (event.changedTouches && event.changedTouches.length > 0)
      this.interactionMove(event.changedTouches[0], event);
  }
  mouseMove(event: MouseEvent) {
    this.interactionMove(event, event);
  }

  interactionMove(
    event: MouseEvent | Touch,
    evt: MouseEvent | TouchEvent
  ): void {
    evt.preventDefault();
    this.navigateMove(event);
  }
  //Soltar
  releaseClick(event: MouseEvent) {
    if (event.button == 0) this.endInteraction(event);
  }

  touchEnd(event: TouchEvent): void {
    if (event.changedTouches && event.changedTouches.length > 0) {
      this.endInteraction(event.changedTouches[0]);
    }
  }
  endInteraction(event: MouseEvent | Touch): void {
    this.keepClicking = false;
    this.navigateEnd();
  }
  //Click o touch en silla
  mousedown(event: MouseEvent, seat: seatPosInterface) {
    // if (event.button == 0) this.interactiveSeat(seat, event);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.resizeFull();
  }
  setPosition(mouse: MouseEvent | Touch): posInterface {
    const rect = this.container.nativeElement.getBoundingClientRect();
    let x = mouse.pageX - rect.left - window.scrollX; // Posición relativa X dentro del elemento
    let y = mouse.pageY - rect.top - window.scrollY; // Posición relativa Y dentro del elemento
    x = x / this.zoom(); // Ajusta x por el factor de zoom
    y = y / this.zoom(); // Ajusta y por el factor de zoom
    x = (x * 100) / this.container.nativeElement.clientWidth;
    y = (y * 100) / this.container.nativeElement.clientHeight;
    return { x, y };
  }

  navigateMove(event: MouseEvent | Touch) {
    if (!this.keepClicking) return;
    if (!this.posOrigin) return;
    const pos = this.setPosition(event);
    this.translatePos = {
      x: this.translatePos.x + pos.x - this.posOrigin.x,
      y: this.translatePos.y + pos.y - this.posOrigin.y,
    };
  }
  navigateEnd() {
    this.posOrigin = undefined;
  }
  resizeSeat() {
    this.sizePixelSize =
      (this.config?.sizeWidth! / 100) *
      this.container.nativeElement.clientWidth;
  }

  resizeFull() {
    if (this.timeOutSize) clearTimeout(this.timeOutSize);
    this.timeOutSize = setTimeout(() => {
      this.resizePlane();
      this.timeOutSize = setTimeout(() => {
        this.resizeSeat();
      }, 3);
    }, 5);
  }
}
