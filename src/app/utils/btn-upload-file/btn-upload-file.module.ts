import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BtnUploadFileDirective } from './btn-upload-file.directive';

@NgModule({
  declarations: [BtnUploadFileDirective],
  imports: [CommonModule],
  exports: [BtnUploadFileDirective],
})
export class BtnUploadFileModule {}
