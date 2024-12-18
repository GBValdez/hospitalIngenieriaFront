import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CataloguesHomeComponent } from './catalogues-home.component';

describe('CataloguesHomeComponent', () => {
  let component: CataloguesHomeComponent;
  let fixture: ComponentFixture<CataloguesHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CataloguesHomeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CataloguesHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
