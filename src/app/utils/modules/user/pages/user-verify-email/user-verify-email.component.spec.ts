import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserVerifyEmailComponent } from './user-verify-email.component';

describe('UserVerifyEmailComponent', () => {
  let component: UserVerifyEmailComponent;
  let fixture: ComponentFixture<UserVerifyEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserVerifyEmailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserVerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
