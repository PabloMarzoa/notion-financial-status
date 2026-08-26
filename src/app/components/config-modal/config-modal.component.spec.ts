import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfigModalComponent } from './config-modal.component';

describe('ConfigModalComponent', () => {
  let component: ConfigModalComponent;
  let fixture: ComponentFixture<ConfigModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize temporary fields with inputs', () => {
    component.initialToken = 'secret_abc';
    component.initialDbId = 'db_123';
    component.ngOnInit();
    expect(component.tempToken).toBe('secret_abc');
    expect(component.tempDbId).toBe('db_123');
  });

  it('should emit save event with token and dbId', () => {
    let savedData: { token: string; dbId: string } | undefined;
    component.save.subscribe((data) => (savedData = data));

    component.tempToken = 'secret_new';
    component.tempDbId = 'db_new';
    component.saveAndApply();

    expect(savedData).toEqual({ token: 'secret_new', dbId: 'db_new' });
  });

  it('should emit close event', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));
    component.closeModal();
    expect(closed).toBe(true);
  });
});
