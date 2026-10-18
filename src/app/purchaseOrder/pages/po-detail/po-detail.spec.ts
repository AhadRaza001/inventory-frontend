import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoDetail } from './po-detail';

describe('PoDetail', () => {
  let component: PoDetail;
  let fixture: ComponentFixture<PoDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(PoDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
