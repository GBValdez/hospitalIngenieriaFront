import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralMenuComponent } from './general-menu.component';

describe('GeneralMenuComponent', () => {
  let component: GeneralMenuComponent;
  let fixture: ComponentFixture<GeneralMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GeneralMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
