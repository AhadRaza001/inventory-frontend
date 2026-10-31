import { TestBed } from '@angular/core/testing';

import { InoutsummaryService } from './inoutsummary-service';

describe('InoutsummaryService', () => {
  let service: InoutsummaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InoutsummaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
