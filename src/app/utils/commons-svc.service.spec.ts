import { TestBed } from '@angular/core/testing';

import { CommonsSvcService } from './commons-svc.service';

describe('CommonsSvcService', () => {
  let service: CommonsSvcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonsSvcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
