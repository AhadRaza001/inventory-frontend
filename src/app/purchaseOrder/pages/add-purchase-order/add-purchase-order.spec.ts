import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPurchaseOrder } from './add-purchase-order';

describe('AddPurchaseOrder', () => {
  let component: AddPurchaseOrder;
  let fixture: ComponentFixture<AddPurchaseOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPurchaseOrder],
    }).compileComponents();

    fixture = TestBed.createComponent(AddPurchaseOrder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
