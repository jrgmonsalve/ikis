import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { FamilyService } from './family.service';
import { CreateFamilyComponent } from './create-family.component';

describe('CreateFamilyComponent', () => {
  let component: CreateFamilyComponent;
  let fixture: ComponentFixture<CreateFamilyComponent>;
  let familyService: { createFamily: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };
  let resolveCreate: (familyId: string) => void;

  beforeEach(async () => {
    familyService = {
      createFamily: vi.fn(
        () => new Promise<string>((resolve) => {
          resolveCreate = resolve;
        }),
      ),
    };
    router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [CreateFamilyComponent],
      providers: [
        { provide: FamilyService, useValue: familyService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateFamilyComponent);
    component = fixture.componentInstance;
  });

  it('ignores repeated submit while family creation is in progress', async () => {
    component.name = 'Familia Garcia';

    const firstSubmit = component.submit();
    await component.submit();

    expect(component.saving()).toBe(true);
    expect(familyService.createFamily).toHaveBeenCalledTimes(1);

    resolveCreate('family-id');
    await firstSubmit;

    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
    expect(component.saving()).toBe(false);
  });
});
