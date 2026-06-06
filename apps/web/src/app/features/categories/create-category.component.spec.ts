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
});
