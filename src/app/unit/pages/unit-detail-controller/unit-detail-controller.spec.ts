import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitDetailController } from './unit-detail-controller';

describe('UnitDetailController', () => {
  let component: UnitDetailController;
  let fixture: ComponentFixture<UnitDetailController>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitDetailController],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitDetailController);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
