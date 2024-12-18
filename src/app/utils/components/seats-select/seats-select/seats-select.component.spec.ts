import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatsSelectComponent } from './seats-select.component';

describe('SeatsSelectComponent', () => {
  let component: SeatsSelectComponent;
  let fixture: ComponentFixture<SeatsSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatsSelectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeatsSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
