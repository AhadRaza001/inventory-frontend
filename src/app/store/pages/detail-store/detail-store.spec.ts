import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailStore } from './detail-store';

describe('DetailStore', () => {
  let component: DetailStore;
  let fixture: ComponentFixture<DetailStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailStore],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailStore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
