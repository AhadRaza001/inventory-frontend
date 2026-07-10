import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitController } from './unit-controller';

describe('UnitController', () => {
  let component: UnitController;
  let fixture: ComponentFixture<UnitController>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitController],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitController);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
