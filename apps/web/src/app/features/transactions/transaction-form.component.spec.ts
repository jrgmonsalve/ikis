import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TransactionFormComponent } from './transaction-form.component';
import { TransactionService } from './transaction.service';
import { AccountService } from '../accounts/account.service';
import { CategoryService } from '../categories/category.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';

describe('TransactionFormComponent', () => {
  let component: TransactionFormComponent;
  let fixture: ComponentFixture<TransactionFormComponent>;
  let mockTransactionService: any;
  let mockAccountService: any;
  let mockCategoryService: any;
  let mockRouter: any;
  let mockParamMapGet: any;

  beforeEach(async () => {
    mockTransactionService = {
      createExpense: vi.fn().mockResolvedValue('tx-id-1'),
      createIncome: vi.fn().mockResolvedValue('tx-id-2'),
      createTransfer: vi.fn().mockResolvedValue('tx-id-3'),
      cancelTransaction: vi.fn().mockResolvedValue(undefined),
      updateTransaction: vi.fn().mockResolvedValue('tx-edit-123'),
      getTransactionById: vi.fn().mockResolvedValue({
        id: 'tx-edit-123',
        type: 'expense',
        amount: 85000,
        accountId: 'acc-1',
        categoryId: 'cat-1',
        description: 'Edit description',
        transactionDate: { toDate: () => new Date('2026-06-05') },
        status: 'active',
        source: 'manual',
      }),
    };

    mockAccountService = {
      listActive: vi.fn().mockResolvedValue([
        { id: 'acc-1', name: 'Savings Account', type: 'savings', currentBalance: 100000 },
        { id: 'acc-2', name: 'Wallet', type: 'cash', currentBalance: 20000 },
      ]),
    };

    mockCategoryService = {
      listActive: vi.fn().mockResolvedValue([
        { id: 'cat-1', name: 'Food' },
        { id: 'cat-2', name: 'Leisure' },
      ]),
      listActiveSubcategories: vi.fn().mockResolvedValue([]),
    };

    mockRouter = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    mockParamMapGet = vi.fn().mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [FormsModule, TransactionFormComponent],
      providers: [
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: AccountService, useValue: mockAccountService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: Router, useValue: mockRouter },
        { provide: I18nService, useValue: { translate: (source: string) => source } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: mockParamMapGet,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load accounts and categories on init', () => {
    expect(mockAccountService.listActive).toHaveBeenCalled();
    expect(mockCategoryService.listActive).toHaveBeenCalled();
    expect(component.accounts().length).toBe(2);
    expect(component.categories().length).toBe(2);
  });

  it('should validate zero or negative amounts', async () => {
    component.amount = 0;
    await component.submit();
    expect(component.error()).toBe('El monto debe ser mayor que cero.');
    expect(mockTransactionService.createExpense).not.toHaveBeenCalled();
  });

  it('should call transactionService.createExpense on submit for expense mode', async () => {
    component.mode.set('expense');
    component.amount = 12000;
    component.accountId = 'acc-1';
    component.categoryId = 'cat-1';
    component.description = 'Lunch';

    await component.submit();

    expect(mockTransactionService.createExpense).toHaveBeenCalledWith({
      amount: 12000,
      accountId: 'acc-1',
      categoryId: 'cat-1',
      subcategoryId: null,
      description: 'Lunch',
      transactionDate: expect.any(String),
    });
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
  });

  it('should call updateTransaction when editing', async () => {
    mockParamMapGet.mockReturnValue('tx-edit-123');

    await component['loadOptions']();

    expect(component.isEdit()).toBe(true);
    expect(component.transactionId()).toBe('tx-edit-123');
    expect(component.amount).toBe(85000);
    expect(component.description).toBe('Edit description');

    component.description = 'Updated Description';

    await component.submit();

    expect(mockTransactionService.updateTransaction).toHaveBeenCalledWith({
      transactionId: 'tx-edit-123',
      amount: 85000,
      accountId: 'acc-1',
      categoryId: 'cat-1',
      subcategoryId: null,
      description: 'Updated Description',
      transactionDate: expect.any(String),
    });
    expect(mockTransactionService.cancelTransaction).not.toHaveBeenCalled();
    expect(mockTransactionService.createExpense).not.toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
  });

  it('should block editing recurring payment transactions', async () => {
    mockParamMapGet.mockReturnValue('tx-edit-123');
    mockTransactionService.getTransactionById.mockResolvedValueOnce({
      id: 'tx-edit-123',
      type: 'expense',
      amount: 85000,
      accountId: 'acc-1',
      categoryId: 'cat-1',
      description: 'Recurring payment',
      transactionDate: { toDate: () => new Date('2026-06-05') },
      status: 'active',
      source: 'recurring_payment',
    });

    await component['loadOptions']();
    await component.submit();

    expect(component.error()).toBe('Los movimientos de pagos recurrentes no se pueden editar. Puedes cancelarlos desde el historial.');
    expect(mockTransactionService.updateTransaction).not.toHaveBeenCalled();
  });

  it('should require a subcategory when the selected category has active subcategories', async () => {
    mockCategoryService.listActiveSubcategories.mockResolvedValue([
      { id: 'sub-1', name: 'Groceries', categoryId: 'cat-1' },
    ]);

    component.mode.set('expense');
    component.amount = 12000;
    component.accountId = 'acc-1';
    component.categoryId = 'cat-1';
    await component['loadSubcategories']('cat-1');

    await component.submit();

    expect(component.error()).toBe('Selecciona una subcategoria.');
    expect(mockTransactionService.createExpense).not.toHaveBeenCalled();
  });

  it('should send subcategoryId when a required subcategory is selected', async () => {
    mockCategoryService.listActiveSubcategories.mockResolvedValue([
      { id: 'sub-1', name: 'Groceries', categoryId: 'cat-1' },
    ]);

    component.mode.set('expense');
    component.amount = 12000;
    component.accountId = 'acc-1';
    component.categoryId = 'cat-1';
    await component['loadSubcategories']('cat-1');
    component.subcategoryId = 'sub-1';

    await component.submit();

    expect(mockTransactionService.createExpense).toHaveBeenCalledWith({
      amount: 12000,
      accountId: 'acc-1',
      categoryId: 'cat-1',
      subcategoryId: 'sub-1',
      description: '',
      transactionDate: expect.any(String),
    });
  });
});
