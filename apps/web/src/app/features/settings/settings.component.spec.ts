import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { SelectedFamilyService } from '../../core/family-context/selected-family.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PeriodService } from '../../core/period/period.service';
import { SettingsComponent } from './settings.component';
import { SettingsService } from './settings.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: any;
  let periodService: any;

  beforeEach(async () => {
    settingsService = {
      getProfile: vi.fn().mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        displayName: 'User',
        preferredLanguage: 'es',
      }),
      updateLanguage: vi.fn().mockResolvedValue(undefined),
      updateFamilyName: vi.fn().mockResolvedValue(undefined),
      updateFamilyActivePeriod: vi.fn().mockResolvedValue(undefined),
    };

    periodService = {
      update: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FormsModule, SettingsComponent],
      providers: [
        { provide: SettingsService, useValue: settingsService },
        {
          provide: SelectedFamilyService,
          useValue: {
            load: vi.fn().mockResolvedValue({
              family: {
                name: 'Family Team',
                mainCurrency: 'COP',
                activePeriod: {
                  periodType: 'monthly',
                  month: 6,
                  year: 2026,
                  customStart: null,
                  customEnd: null,
                },
              },
              membership: { role: 'owner' },
            }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            signOut: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: I18nService,
          useValue: {
            setLanguage: vi.fn(),
          },
        },
        { provide: PeriodService, useValue: periodService },
        {
          provide: Router,
          useValue: {
            navigateByUrl: vi.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('saves the family active period when the user is owner', async () => {
    component.periodType = 'yearly';
    component.year = 2027;

    await component.savePeriod();

    expect(settingsService.updateFamilyActivePeriod).toHaveBeenCalledWith({
      periodType: 'yearly',
      month: null,
      year: 2027,
      customStart: null,
      customEnd: null,
    });
    expect(periodService.update).toHaveBeenCalledWith({
      periodType: 'yearly',
      month: 6,
      year: 2027,
      customStart: expect.any(String),
      customEnd: expect.any(String),
    });
  });
});
