import { TestBed } from '@angular/core/testing';

import { PsDetailService } from './ps-detail-service';

describe('PsDetailService', () => {
  let service: PsDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PsDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
