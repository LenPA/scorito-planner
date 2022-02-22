import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiderCardComponent } from './rider-card.component';

describe('RiderCardComponent', () => {
  let component: RiderCardComponent;
  let fixture: ComponentFixture<RiderCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiderCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiderCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
