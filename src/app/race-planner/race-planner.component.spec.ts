import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RacePlannerComponent } from './race-planner.component';

describe('RacePlannerComponent', () => {
  let component: RacePlannerComponent;
  let fixture: ComponentFixture<RacePlannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacePlannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RacePlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
