import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitAddController } from './unit-add-controller';

describe('UnitAddController', () => {
  let component: UnitAddController;
  let fixture: ComponentFixture<UnitAddController>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitAddController],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitAddController);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
