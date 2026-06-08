import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CreateBudgetComponent } from './create-budget.component';
import { BudgetService } from './budget.service';
import { CategoryService } from '../categories/category.service';
import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { Router, ActivatedRoute } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';

describe('CreateBudgetComponent', () => {
  let component: CreateBudgetComponent;
  let fixture: ComponentFixture<CreateBudgetComponent>;
  let mockBudgetService: any;
  let mockCategoryService: any;
  let mockSelectedFamilyService: any;
  let mockRouter: any;
  let mockI18nService: any;
  let mockParamMapGet: any;
  let mockRouteData: Record<string, string>;

  beforeEach(async () => {
    mockBudgetService = {
      create: vi.fn().mockResolvedValue('budget-id-123'),
      update: vi.fn().mockResolvedValue(undefined),
      getById: vi.fn().mockResolvedValue({
        id: 'budget-id-edit',
        name: 'Mock Budget',
        categoryId: 'cat-1',
        plannedAmount: 150000,
        periodType: 'monthly',
        month: 5,
        year: 2026,
        startDate: { toDate: () => new Date('2026-05-01') },
        endDate: { toDate: () => new Date('2026-05-31'), toMillis: () => new Date('2026-05-31').getTime() },
      }),
    };

    mockCategoryService = {
      listActive: vi.fn().mockResolvedValue([
        { id: 'cat-1', name: 'Food', color: '#ff0000' },
        { id: 'cat-2', name: 'Rent', color: '#00ff00' },
      ]),
    };

    mockSelectedFamilyService = {
      load: vi.fn().mockResolvedValue({
        family: {
          mainCurrency: 'COP',
          name: 'Family Team',
          activePeriod: {
            periodType: 'monthly',
            month: 7,
            year: 2026,
            customStart: null,
            customEnd: null,
          },
        },
        membership: { role: 'admin' },
      }),
    };

    mockRouter = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    mockI18nService = {
      translate: vi.fn((key: string) => key),
      locale: vi.fn().mockReturnValue('es-CO'),
    };

    mockParamMapGet = vi.fn().mockReturnValue(null);
    mockRouteData = {};

    await TestBed.configureTestingModule({
      imports: [FormsModule, CreateBudgetComponent],
      providers: [
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: SelectedFamilyService, useValue: mockSelectedFamilyService },
        { provide: Router, useValue: mockRouter },
        { provide: I18nService, useValue: mockI18nService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: mockRouteData,
              paramMap: {
                get: mockParamMapGet,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateBudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories and context on init', () => {
    expect(mockCategoryService.listActive).toHaveBeenCalled();
    expect(component.categories().length).toBe(2);
    expect(component.currency()).toBe('COP');
  });

  it('should validate empty fields on submit', async () => {
    component.name = '';
    component.categoryId = '';
    await component.submit();
    expect(component.error()).toBe('Completa el nombre y la categoria.');
    expect(mockBudgetService.create).not.toHaveBeenCalled();
  });

  it('should call budgetService.create and navigate on valid submit in create mode', async () => {
    await fixture.whenStable();
    component.name = 'Groceries';
    component.categoryId = 'cat-1';
    component.plannedAmount = 100000;

    await component.submit();

    expect(mockBudgetService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        periodType: 'monthly',
        month: 7,
        year: 2026,
      }),
    );
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/budgets');
  });

  it('should load budget for editing when id param is present', async () => {
    mockParamMapGet.mockReturnValue('budget-id-edit');
    
    // Re-trigger initialize
    await component['load']();
    
    expect(component.isEdit()).toBe(true);
    expect(component.budgetId()).toBe('budget-id-edit');
    expect(component.name).toBe('Mock Budget');
    expect(component.plannedAmount).toBe(150000);
    await component.submit();
    expect(mockBudgetService.update).toHaveBeenCalledWith(
      'budget-id-edit',
      expect.objectContaining({
        periodType: 'monthly',
        month: 5,
        year: 2026,
      }),
    );
  });
  it("copies a budget into the currently configured family period", async () => {
    mockParamMapGet.mockReturnValue("budget-id-edit");
    mockRouteData["mode"] = "copy";
    await component["load"]();
    expect(component.isCopy()).toBe(true);
    expect(component.isEdit()).toBe(false);
    expect(component.month).toBe(7);
    expect(component.year).toBe(2026);
    await component.submit();
    expect(mockBudgetService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        periodType: 'monthly',
        month: 7,
        year: 2026,
      }),
    );
    expect(mockBudgetService.update).not.toHaveBeenCalled();
  });
});
