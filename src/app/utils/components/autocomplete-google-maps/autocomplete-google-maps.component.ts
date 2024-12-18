import {
  AfterViewInit,
  Component,
  ElementRef,
  output,
  OutputEmitterRef,
  ViewChild,
  viewChild,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-autocomplete-google-maps',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  templateUrl: './autocomplete-google-maps.component.html',
  styleUrl: './autocomplete-google-maps.component.scss',
})
export class AutocompleteGoogleMapsComponent implements AfterViewInit {
  constructor(spinnerSvc: NgxSpinnerService) {}
  @ViewChild('inputField') search!: ElementRef;
  autoComplete!: google.maps.places.Autocomplete;
  changeComplete: OutputEmitterRef<google.maps.LatLng> = output();
  ngAfterViewInit(): void {
    this.autoComplete = new google.maps.places.Autocomplete(
      this.search.nativeElement
    );

    this.autoComplete.addListener('place_changed', () => {
      const place = this.autoComplete.getPlace();
      if (place.geometry)
        if (place.geometry.location)
          this.changeComplete.emit(place.geometry.location);
      console.log(place);
    });
  }
}
