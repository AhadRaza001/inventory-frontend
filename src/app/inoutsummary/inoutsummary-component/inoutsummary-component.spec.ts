import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InoutsummaryComponent } from './inoutsummary-component';

describe('InoutsummaryComponent', () => {
  let component: InoutsummaryComponent;
  let fixture: ComponentFixture<InoutsummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InoutsummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InoutsummaryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
