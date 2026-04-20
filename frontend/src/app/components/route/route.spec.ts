import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

@Component({
  selector: 'app-route',
  template: ''
})
class Route {}

describe('Route', () => {
  let component: Route;
  let fixture: ComponentFixture<Route>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Route]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Route);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
