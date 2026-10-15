import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Route guard that only permits access if the logged-in user is an admin.
 * If not authorized, redirects to the home overview page.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAdmin$.pipe(
    take(1),
    map(isAdmin => {
      if (isAdmin) {
        return true;
      }
      router.navigate(['/']);
      return false;
    })
  );
};
