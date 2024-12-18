import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[drShowError]',
  standalone: true,
})
export class DrErrorInputsDirective {
  private _errorName!: string;

  @Input() set drShowError(value: string) {
    this._errorName = value;
    this.updateView(); // Actualiza la vista cada vez que cambia el input.
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private ngControl: NgControl
  ) {
    // Observa los cambios en el estado de validación del control de formulario.
    this.ngControl.statusChanges!.subscribe(() => this.updateView());
  }

  private updateView() {
    // Limpia el contenedor para asegurarnos de que no duplicamos el mensaje de error.
    this.viewContainer.clear();
    // Verifica si el control existe, tiene errores y contiene el error específico.
    if (this.ngControl.control?.errors?.[this._errorName]) {
      // Si se cumple la condición, muestra el mensaje de error.
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
