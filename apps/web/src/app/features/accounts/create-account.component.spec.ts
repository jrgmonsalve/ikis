import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CreateAccountComponent } from './create-account.component';
import { AccountService } from './account.service';
import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { Router, ActivatedRoute } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';

describe('CreateAccountComponent', () => {
  let component: CreateAccountComponent;
  let fixture: ComponentFixture<CreateAccountComponent>;
  let mockAccountService: any;
  let mockSelectedFamilyService: any;
  let mockRouter: any;
  let mockI18nService: any;

  beforeEach(async () => {
    mockAccountService = {
      create: vi.fn().mockResolvedValue('account-id-123'),
    };

    mockSelectedFamilyService = {
      load: vi.fn().mockResolvedValue({
        family: { mainCurrency: 'COP', name: 'Family Team' },
        membership: { role: 'admin' },
      }),
    };

    mockRouter = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    mockI18nService = {
      translate: vi.fn((key: string) => key),
    };

    await TestBed.configureTestingModule({
      imports: [FormsModule, CreateAccountComponent],
      providers: [
        { provide: AccountService, useValue: mockAccountService },
        { provide: SelectedFamilyService, useValue: mockSelectedFamilyService },
        { provide: Router, useValue: mockRouter },
        { provide: I18nService, useValue: mockI18nService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load family context and set currency on init', () => {
    expect(mockSelectedFamilyService.load).toHaveBeenCalled();
    expect(component.currency()).toBe('COP');
  });

  it('should show error if name is empty on submit', async () => {
    component.name = '';
    await component.submit();
    expect(component.error()).toBe('Ingresa el nombre de la cuenta.');
    expect(mockAccountService.create).not.toHaveBeenCalled();
  });

  it('should call accountService.create and navigate on valid submit', async () => {
    component.name = 'Savings Account';
    component.type = 'savings';
    component.initialBalance = 50000;
    
    await component.submit();
    
    expect(mockAccountService.create).toHaveBeenCalledWith({
      name: 'Savings Account',
      type: 'savings',
      initialBalance: 50000,
      currency: 'COP',
    });
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/accounts');
  });
});
