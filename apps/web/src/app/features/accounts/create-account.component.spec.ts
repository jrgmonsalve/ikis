import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CreateAccountComponent } from './create-account.component';
import { AccountService } from './account.service';
import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { Router, ActivatedRoute } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { Timestamp } from 'firebase/firestore';

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
      getById: vi.fn().mockResolvedValue({
        id: 'account-id-123',
        familyId: 'family-id-123',
        name: 'Nequi',
        type: 'digital_wallet',
        initialBalance: 75000,
        currentBalance: 75000,
        currency: 'COP',
        createdByUserId: 'user-id-123',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'active',
      }),
      update: vi.fn().mockResolvedValue(undefined),
      deactivate: vi.fn().mockResolvedValue(undefined),
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

  it('should update only the account name in edit mode', async () => {
    component.isEdit.set(true);
    component.accountId.set('account-id-123');
    component.name = 'Updated Savings';
    component.type = 'credit_card';
    component.initialBalance = 20000;

    await component.submit();

    expect(mockAccountService.update).toHaveBeenCalledWith('account-id-123', {
      name: 'Updated Savings',
    });
    expect(mockAccountService.create).not.toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/accounts');
  });

  it('should preload account values in edit mode', async () => {
    TestBed.resetTestingModule();

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
                get: () => 'account-id-123',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockAccountService.getById).toHaveBeenCalledWith('account-id-123');
    await vi.waitFor(() => expect(component.name).toBe('Nequi'));

    expect(component.isEdit()).toBe(true);
    expect(component.type).toBe('digital_wallet');
    expect(component.initialBalance).toBe(75000);
  });
});
