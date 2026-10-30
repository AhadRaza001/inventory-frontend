import { TestBed } from '@angular/core/testing';

import { ItemledgerService } from './itemledger-service';

describe('ItemledgerService', () => {
  let service: ItemledgerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemledgerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
