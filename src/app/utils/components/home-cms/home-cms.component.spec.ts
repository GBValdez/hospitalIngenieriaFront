import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeCmsComponent } from './home-cms.component';

describe('HomeCmsComponent', () => {
  let component: HomeCmsComponent;
  let fixture: ComponentFixture<HomeCmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeCmsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeCmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
