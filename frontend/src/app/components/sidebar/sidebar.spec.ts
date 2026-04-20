import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar';
import { Router } from '@angular/router';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit sectionChange when setActiveSection is called', () => {
    spyOn(component.sectionChange, 'emit');
    component.setActiveSection('mapa');
    expect(component.sectionChange.emit).toHaveBeenCalledWith('mapa');
  });

  it('should emit logoutClick when logout is called', () => {
    spyOn(component.logoutClick, 'emit');
    component.logout();
    expect(component.logoutClick.emit).toHaveBeenCalled();
  });

  it('should toggle collapsed class based on isOpen input', () => {
    component.isOpen = false;
    fixture.detectChanges();
    const sidebar = fixture.nativeElement.querySelector('.sidebar');
    expect(sidebar.classList.contains('collapsed')).toBe(true);
  });
});
