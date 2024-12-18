import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appOnlyNumberInput]',
  standalone: true,
})
export class OnlyNumberInputDirective {
  @Input() decimals: boolean = false; // Define el input para permitir decimales

  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('input', ['$event']) onInputChange(event: any) {
    let start = this.el.nativeElement.selectionStart;
    const initalValue = this.el.nativeElement.value;

    // Expresión regular para permitir solo números y decimales si se permite
    const regex = this.decimals ? /[^0-9.]/g : /[^0-9]/g;

    // Remplaza los caracteres no permitidos
    this.control.control?.setValue(initalValue.replace(regex, ''));

    // Si el valor ha cambiado, ajusta el cursor
    if (initalValue !== this.el.nativeElement.value) {
      const diff = initalValue.length - this.el.nativeElement.value.length;
      start -= diff;
      this.el.nativeElement.setSelectionRange(start, start);
      event.stopPropagation();
    }
  }

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    // Permitir teclas especiales como retroceso, tabulación, etc.
    const allowedKeys = [
      'Backspace',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Si no se permiten decimales, bloquear la tecla del punto (.)
    if (!this.decimals && event.key === '.') {
      event.preventDefault();
    }

    // Si se permiten decimales, permitir un solo punto (.)
    if (
      this.decimals &&
      event.key === '.' &&
      this.el.nativeElement.value.includes('.')
    ) {
      event.preventDefault();
    }
  }
}
