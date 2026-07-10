import { TestBed } from '@angular/core/testing';

import { GenerateNumberService } from './generate-number-service';

describe('GenerateNumberService', () => {
  let service: GenerateNumberService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenerateNumberService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
