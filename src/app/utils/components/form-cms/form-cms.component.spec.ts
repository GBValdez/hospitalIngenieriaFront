import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCmsComponent } from './form-cms.component';

describe('FormCmsComponent', () => {
  let component: FormCmsComponent;
  let fixture: ComponentFixture<FormCmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCmsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormCmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
