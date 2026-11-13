import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStore } from './add-store';

describe('AddStore', () => {
  let component: AddStore;
  let fixture: ComponentFixture<AddStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddStore],
    }).compileComponents();

    fixture = TestBed.createComponent(AddStore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
