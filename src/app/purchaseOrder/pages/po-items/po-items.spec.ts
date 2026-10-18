import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoItems } from './po-items';

describe('PoItems', () => {
  let component: PoItems;
  let fixture: ComponentFixture<PoItems>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoItems],
    }).compileComponents();

    fixture = TestBed.createComponent(PoItems);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
