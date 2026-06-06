import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { AccountService } from '../accounts/account.service';
import { ReportService } from '../reports/report.service';
import { BudgetService } from '../budgets/budget.service';
import { RecurringPaymentService } from '../recurring-payments/recurring-payment.service';
import { CategoryService } from '../categories/category.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PeriodService } from '../../core/period/period.service';
import { Router, ActivatedRoute } from '@angular/router';
import { TransactionService } from '../transactions/transaction.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockSelectedFamilyService: any;
  let mockAccountService: any;
  let mockReportService: any;
  let mockBudgetService: any;
  let mockRecurringPaymentService: any;
  let mockCategoryService: any;
  let mockI18nService: any;
  let mockPeriodService: any;
  let mockRouter: any;
  let mockTransactionService: any;

  beforeEach(async () => {
    mockSelectedFamilyService = {
      load: vi.fn().mockResolvedValue({
        family: { name: 'Family Team', mainCurrency: 'COP' },
        membership: { role: 'admin' },
      }),
    };

    mockAccountService = {
      listActive: vi.fn().mockResolvedValue([
        { id: 'acc-1', name: 'Debit Card', type: 'savings', currentBalance: 250000, status: 'active' },
        { id: 'acc-2', name: 'Cash Wallet', type: 'cash', currentBalance: 50000, status: 'active' },
      ]),
    };

    mockReportService = {
      load: vi.fn().mockResolvedValue({
        summary: {
          totalIncome: 100000,
          totalExpenses: 40000,
          netFlow: 60000,
          expensesByCategory: [{ categoryId: 'cat-1', amount: 40000 }],
        },
      }),
    };

    mockBudgetService = {
      listWithProgress: vi.fn().mockResolvedValue([
        {
          budget: {
            id: 'bud-1',
            name: 'Food budget',
            categoryId: 'cat-1',
            plannedAmount: 100000,
            startDate: { toDate: () => new Date('2026-06-01') },
            endDate: { toDate: () => new Date('2026-06-30') },
          },
          progress: { spentAmount: 40000, remainingAmount: 60000, percentageUsed: 40, exceeded: false },
        },
      ]),
    };

    mockRecurringPaymentService = {
      listActive: vi.fn().mockResolvedValue([
        {
          id: 'pay-1',
          name: 'Netflix subscription',
          expectedAmount: 45000,
          nextDueDate: {
            toMillis: () => Date.now() + 86400000 * 2, // 2 days from now
            toDate: () => new Date(Date.now() + 86400000 * 2),
          },
        },
      ]),
    };

    mockCategoryService = {
      listActive: vi.fn().mockResolvedValue([
        { id: 'cat-1', name: 'Food', color: '#ff0000', icon: 'fa-utensils' },
      ]),
    };

    mockI18nService = {
      translate: vi.fn((key: string) => key),
      locale: vi.fn().mockReturnValue('es-CO'),
    };

    mockPeriodService = {
      state: vi.fn().mockReturnValue({
        periodType: 'monthly',
        month: 6,
        year: 2026,
        customStart: '2026-06-01',
        customEnd: '2026-06-30',
      }),
      activePeriod: vi.fn().mockReturnValue({
        startDate: new Date('2026-06-01T00:00:00'),
        endDate: new Date('2026-06-30T23:59:59'),
      }),
    };

    mockRouter = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    mockTransactionService = {
      listRecent: vi.fn().mockResolvedValue([
        {
          id: 'tx-1',
          type: 'expense',
          amount: 15000,
          description: 'Burgers',
          transactionDate: { toDate: () => new Date('2026-06-05'), toMillis: () => new Date('2026-06-05').getTime() },
          accountId: 'acc-1',
          categoryId: 'cat-1',
        }
      ]),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: SelectedFamilyService, useValue: mockSelectedFamilyService },
        { provide: AccountService, useValue: mockAccountService },
        { provide: ReportService, useValue: mockReportService },
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: RecurringPaymentService, useValue: mockRecurringPaymentService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: I18nService, useValue: mockI18nService },
        { provide: PeriodService, useValue: mockPeriodService },
        { provide: Router, useValue: mockRouter },
        { provide: TransactionService, useValue: mockTransactionService },
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

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load all data and calculate available balance', async () => {
    await fixture.whenStable();
    expect(mockSelectedFamilyService.load).toHaveBeenCalled();
    expect(mockAccountService.listActive).toHaveBeenCalled();
    expect(mockReportService.load).toHaveBeenCalled();
    expect(mockBudgetService.listWithProgress).toHaveBeenCalled();
    expect(mockRecurringPaymentService.listActive).toHaveBeenCalled();
    expect(mockCategoryService.listActive).toHaveBeenCalled();
    expect(mockTransactionService.listRecent).toHaveBeenCalledWith(10);

    expect(component.availableBalance()).toBe(300000); // 250k + 50k
    expect(component.familyName()).toBe('Family Team');
  });

  it('should correctly filter and map budgets active in the selected period', async () => {
    await fixture.whenStable();
    expect(component.budgets().length).toBe(1);
    expect(component.budgets()[0].budget.name).toBe('Food budget');
  });

  it('should correctly compute donut chart conic gradient and legend data', async () => {
    await fixture.whenStable();
    const data = component.chartData();
    expect(data.hasData).toBe(true);
    expect(data.legend.length).toBe(2);
    expect(data.legend[0].name).toBe('Debit Card');
    expect(data.legend[0].balance).toBe(250000);
    expect(data.legend[1].name).toBe('Cash Wallet');
    expect(data.legend[1].balance).toBe(50000);
    expect(data.gradient).toContain('conic-gradient');
  });
});
