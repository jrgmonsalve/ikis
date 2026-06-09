import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CreateCategoryComponent } from './create-category.component';
import { CategoryService } from './category.service';
import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

describe('CreateCategoryComponent', () => {
  let component: CreateCategoryComponent;
  let fixture: ComponentFixture<CreateCategoryComponent>;
  let mockCategoryService: any;
  let mockSelectedFamilyService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  function createComponent(routeId: string | null = null, role = 'admin') {
    mockCategoryService = {
      create: vi.fn().mockResolvedValue('cat-123'),
      update: vi.fn().mockResolvedValue(undefined),
      listActiveSubcategories: vi.fn().mockResolvedValue([
        { id: 'sub-1', name: 'Groceries', categoryId: 'cat-edit-123' },
      ]),
      createSubcategory: vi.fn().mockResolvedValue('sub-2'),
      updateSubcategory: vi.fn().mockResolvedValue(undefined),
      deactivateSubcategory: vi.fn().mockResolvedValue(undefined),
      getById: vi.fn().mockResolvedValue({
        id: 'cat-edit-123',
        name: 'Restaurantes',
        color: '#db2777',
        icon: 'fa-utensils',
      }),
    };

    mockSelectedFamilyService = {
      load: vi.fn().mockResolvedValue({
        family: { name: 'Family Team' },
        membership: { role },
      }),
    };

    mockRouter = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: () => routeId,
        },
      },
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FormsModule, CreateCategoryComponent],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: SelectedFamilyService, useValue: mockSelectedFamilyService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    });

    fixture = TestBed.createComponent(CreateCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create the component', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should redirect to categories list if role is not owner or admin', async () => {
    createComponent(null, 'member');
    // Wait for async initialization
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/categories');
  });

  it('should validate name is not empty on submit', async () => {
    createComponent();
    component.name = '';
    await component.submit();
    expect(component.error()).toBe('Ingresa el nombre de la categoria.');
    expect(mockCategoryService.create).not.toHaveBeenCalled();
  });

  it('should call categoryService.create on valid submit in creation mode', async () => {
    createComponent();
    component.name = 'Supermercado';
    component.color = '#16a34a';
    component.icon = 'fa-bag-shopping';

    await component.submit();

    expect(mockCategoryService.create).toHaveBeenCalledWith({
      name: 'Supermercado',
      color: '#16a34a',
      icon: 'fa-bag-shopping',
    });
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/categories');
  });

  it('should load category and update on submit in edit mode', async () => {
    createComponent('cat-edit-123');
    // Wait for initialization to retrieve category
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(component.isEdit()).toBe(true);
    expect(component.name).toBe('Restaurantes');
    expect(component.color).toBe('#db2777');
    expect(component.icon).toBe('fa-utensils');

    component.name = 'Restaurantes Editado';
    component.color = '#7c3aed';

    await component.submit();

    expect(mockCategoryService.update).toHaveBeenCalledWith('cat-edit-123', {
      name: 'Restaurantes Editado',
      color: '#7c3aed',
      icon: 'fa-utensils',
    });
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/categories');
  });

  it('should list and create subcategories in edit mode', async () => {
    createComponent('cat-edit-123');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockCategoryService.listActiveSubcategories).toHaveBeenCalledWith('cat-edit-123');
    expect(component.subcategories()).toEqual([
      { id: 'sub-1', name: 'Groceries', categoryId: 'cat-edit-123' },
    ]);

    component.subcategoryName = 'Fast food';
    await component.saveSubcategory();

    expect(mockCategoryService.createSubcategory).toHaveBeenCalledWith('cat-edit-123', {
      name: 'Fast food',
    });
  });

  it('should update and deactivate subcategories in edit mode', async () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    createComponent('cat-edit-123');
    await new Promise((resolve) => setTimeout(resolve, 10));

    component.startSubcategoryEdit({ id: 'sub-1', name: 'Groceries' } as any);
    component.subcategoryName = 'Market';
    await component.saveSubcategory();

    expect(mockCategoryService.updateSubcategory).toHaveBeenCalledWith('cat-edit-123', 'sub-1', {
      name: 'Market',
    });

    await component.deactivateSubcategory('sub-1');

    expect(mockCategoryService.deactivateSubcategory).toHaveBeenCalledWith('cat-edit-123', 'sub-1');
  });
});
