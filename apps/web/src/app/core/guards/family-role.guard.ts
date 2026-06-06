import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { MemberRole } from '../../shared/models/domain.models';
import { SelectedFamilyService } from '../family-context/selected-family.service';

export function familyRoleGuard(allowedRoles: readonly MemberRole[]): CanActivateFn {
  return async () => {
    const selectedFamily = inject(SelectedFamilyService);
    const router = inject(Router);

    try {
      const context = await selectedFamily.load();
      return allowedRoles.includes(context.membership.role)
        ? true
        : router.createUrlTree(['/app/dashboard']);
    } catch {
      return router.createUrlTree(['/select-family']);
    }
  };
}

export function isRoleAllowed(
  role: MemberRole,
  allowedRoles: readonly MemberRole[],
): boolean {
  return allowedRoles.includes(role);
}
