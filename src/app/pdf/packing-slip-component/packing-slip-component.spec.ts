import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackingSlipComponent } from './packing-slip-component';

describe('PackingSlipComponent', () => {
  let component: PackingSlipComponent;
  let fixture: ComponentFixture<PackingSlipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackingSlipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PackingSlipComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
