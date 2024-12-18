import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appOnlyNumberLetterInput]',
  standalone: true,
})
export class OnlyNumberLetterInputDirective {
  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('input', ['$event']) onInputChange(event: any) {
    let start = this.el.nativeElement.selectionStart;
    const initalValue = this.el.nativeElement.value;
    this.control.control?.setValue(initalValue.replace(/[^a-zA-Z0-9]*/g, ''));

    if (initalValue !== this.el.nativeElement.value) {
      const diff = initalValue.length - this.el.nativeElement.value.length;
      start -= diff;
      this.el.nativeElement.setSelectionRange(start, start);
      event.stopPropagation();
    }
  }
}
