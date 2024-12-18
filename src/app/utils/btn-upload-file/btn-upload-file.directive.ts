import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

@Directive({
  selector: '[dtBtnUploadFile]',
})
export class BtnUploadFileDirective implements AfterViewInit, OnChanges {
  constructor(
    private elementRef: ElementRef<HTMLButtonElement>,
    // private toast: MatSnackBar,
    private renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['file'] === undefined && this.originalText != '') {
      this.changeLabel();
    }
  }
  ngAfterViewInit(): void {
    this.originalText = this.elementRef.nativeElement.innerHTML;
  }

  @Input() typesPermitted: string = '.pdf';
  @Input() maxSize: number = -1;
  @Input() maxFile: number = 1;
  @Input() changeContent: boolean = true;
  @Input() file: FileList | undefined;
  @Output() fileChange: EventEmitter<FileList | undefined> = new EventEmitter<
    FileList | undefined
  >();
  private originalText: string = '';

  mimeExtensions: any = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      '.docx',
    ],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
      '.xlsx',
    ],
    'application/zip': ['.zip'],
    'audio/mpeg': ['.mp3'],
    'video/mp4': ['.mp4'],
    'image/webp': ['.webp'],
  };

  @Output() filesDropped: EventEmitter<FileList> = new EventEmitter<FileList>();
  @Output() filesHovered: EventEmitter<any> = new EventEmitter();
  @Output() filesLeave: EventEmitter<any> = new EventEmitter();
  @HostListener('drop', ['$event']) onDrop($event: DragEvent) {
    $event.preventDefault();
    let transfer = $event.dataTransfer;
    if (transfer) this.uploadFile(transfer.files);
  }

  @HostListener('dragover', ['$event']) onDragOver($event: DragEvent) {
    $event.preventDefault();
    this.filesHovered.emit();
  }
  @HostListener('dragleave', ['$event']) onDragLeave($event: DragEvent) {
    $event.preventDefault();
    this.filesLeave.emit();
  }
  @HostListener('click', ['$event']) onClick($event: DragEvent) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.typesPermitted;
    input.multiple = this.maxFile != 1;
    input.click();
    input.onchange = (e: any) => {
      this.uploadFile(e.target.files);
      input.remove();
    };
  }

  uploadFile(file: FileList | undefined) {
    if (this.valid(file)) {
      this.file = file;
    } else {
      this.file = undefined;
    }
    this.fileChange.emit(this.file);
    this.changeLabel();
  }

  changeLabel() {
    if (this.changeContent)
      if (this.file) {
        if (this.file.length == 1) {
          this.renderer.setProperty(
            this.elementRef.nativeElement,
            'innerHTML',
            this.file.item(0)?.name || ''
          );
        }
        if (this.file.length > 1) {
          this.renderer.setProperty(
            this.elementRef.nativeElement,
            'innerHTML',
            `${this.file.length} archivos seleccionados`
          );
        }
      } else {
        this.renderer.setProperty(
          this.elementRef.nativeElement,
          'innerHTML',
          this.originalText
        );
      }
  }

  valid(files: FileList | undefined): boolean {
    if (!files) {
      // this.toast.open('No se ha seleccionado ningún archivo', 'cerrar', {
      //   duration: 3000,
      // });
      return false;
    }
    const length = files.length;
    if (length <= this.maxFile || this.maxFile == -1) {
      for (let index = 0; index < length; index++) {
        const file = files.item(index);
        let error = '';
        const MIME_EXTENSION: string[] = this.mimeExtensions[file!.type];
        if (
          !this.typesPermitted
            .split(',')
            .some((type) => MIME_EXTENSION?.includes(type))
        ) {
          error = `El archivo "${file?.name}" es invalido`;
        }
        if (this.maxSize != -1)
          if (file!.size > this.maxSize) {
            error = `El archivo "${file?.name}" supera los ${
              this.maxSize / 1000000
            } mg`;
          }
        if (error != '') {
          // this.toast.open(error, 'cerrar', {
          //   duration: 3000,
          // });
          return false;
        }
      }
      return true;
    } else {
      // this.toast.open(
      //   'Ha superado la cantidad de archivos que se pueden subir',
      //   'Cerrar',
      //   {
      //     duration: 3000,
      //   }
      // );
      return false;
    }
  }
}
