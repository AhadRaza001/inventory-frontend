import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoDetailComponent } from './so-detail-component';

describe('SoDetailComponent', () => {
  let component: SoDetailComponent;
  let fixture: ComponentFixture<SoDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SoDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
