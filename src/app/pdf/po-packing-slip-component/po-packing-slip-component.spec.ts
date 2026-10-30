import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoPackingSlipComponent } from './po-packing-slip-component';

describe('PoPackingSlipComponent', () => {
  let component: PoPackingSlipComponent;
  let fixture: ComponentFixture<PoPackingSlipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoPackingSlipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PoPackingSlipComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
