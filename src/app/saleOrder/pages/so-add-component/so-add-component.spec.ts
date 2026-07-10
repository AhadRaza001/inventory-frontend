import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoAddComponent } from './so-add-component';

describe('SoAddComponent', () => {
  let component: SoAddComponent;
  let fixture: ComponentFixture<SoAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoAddComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SoAddComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
