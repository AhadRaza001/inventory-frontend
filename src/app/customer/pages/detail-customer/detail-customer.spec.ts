import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailCustomer } from './detail-customer';

describe('DetailCustomer', () => {
  let component: DetailCustomer;
  let fixture: ComponentFixture<DetailCustomer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailCustomer],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailCustomer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
