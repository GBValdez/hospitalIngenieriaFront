import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMakerListComponent } from './list-maker-list.component';

describe('ListMakerListComponent', () => {
  let component: ListMakerListComponent;
  let fixture: ComponentFixture<ListMakerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListMakerListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListMakerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
