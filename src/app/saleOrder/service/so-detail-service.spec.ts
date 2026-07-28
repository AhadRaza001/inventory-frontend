import { TestBed } from '@angular/core/testing';

import { SoDetailService } from './so-detail-service';

describe('SoDetailService', () => {
  let service: SoDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
