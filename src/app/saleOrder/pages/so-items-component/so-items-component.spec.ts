import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoItemsComponent } from './so-items-component';

describe('SoItemsComponent', () => {
  let component: SoItemsComponent;
  let fixture: ComponentFixture<SoItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoItemsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SoItemsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
