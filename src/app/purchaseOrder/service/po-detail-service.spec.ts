import { TestBed } from '@angular/core/testing';

import { PoDetailService } from './po-detail-service';

describe('PoDetailService', () => {
  let service: PoDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PoDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
