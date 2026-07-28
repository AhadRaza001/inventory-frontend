import { TestBed } from '@angular/core/testing';

import { PackingSlipSerive } from './packing-slip-serive';

describe('PackingSlipSerive', () => {
  let service: PackingSlipSerive;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PackingSlipSerive);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
