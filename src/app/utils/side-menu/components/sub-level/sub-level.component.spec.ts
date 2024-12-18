import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubLevelComponent } from './sub-level.component';

describe('SubLevelComponent', () => {
  let component: SubLevelComponent;
  let fixture: ComponentFixture<SubLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubLevelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
