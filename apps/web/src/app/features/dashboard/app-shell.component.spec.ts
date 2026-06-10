import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyContextService } from '../../core/family-context/family-context.service';
import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { AppShellComponent } from './app-shell.component';

@Component({ standalone: true, template: '' })
class EmptyComponent {}

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let authService: any;
  let router: Router;

  beforeEach(async () => {
    authService = {
      currentUser: vi.fn().mockReturnValue({ displayName: 'Rene User', email: 'rene@example.com' }),
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([{ path: 'sign-in', component: EmptyComponent }]),
        { provide: AuthService, useValue: authService },
        { provide: I18nService, useValue: { translate: (source: string) => source } },
        {
          provide: FamilyContextService,
          useValue: { selectedFamilyId: vi.fn().mockReturnValue('family-a') },
        },
        {
          provide: SelectedFamilyService,
          useValue: {
            load: vi.fn().mockResolvedValue({
              family: { name: 'Familia A' },
              membership: { role: 'admin', displayName: 'Admin User' },
            }),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows profile menu with user name, role and sign out action', async () => {
    const profileButton = fixture.nativeElement.querySelector('header button[aria-label="Abrir menu de perfil"]');
    profileButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Rene User');
    expect(fixture.nativeElement.textContent).toContain('Rol: Admin');
    expect(fixture.nativeElement.textContent).toContain('Cerrar sesion');
  });

  it('signs out from the profile menu', async () => {
    const profileButton = fixture.nativeElement.querySelector('header button[aria-label="Abrir menu de perfil"]');
    profileButton.click();
    fixture.detectChanges();

    const signOutButton = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((button: any) => button.textContent.includes('Cerrar sesion')) as HTMLButtonElement;
    signOutButton.click();
    await fixture.whenStable();

    expect(authService.signOut).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/sign-in');
  });
});
