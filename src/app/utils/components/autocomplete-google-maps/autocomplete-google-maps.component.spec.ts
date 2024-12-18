import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutocompleteGoogleMapsComponent } from './autocomplete-google-maps.component';

describe('AutocompleteGoogleMapsComponent', () => {
  let component: AutocompleteGoogleMapsComponent;
  let fixture: ComponentFixture<AutocompleteGoogleMapsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutocompleteGoogleMapsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutocompleteGoogleMapsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
