import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).getAccessToken();

  if (!token && request.url.startsWith('http://localhost:3000')) {
    return next(
      request.clone({
        setHeaders: {
          'X-Local-User-Id': 'local-dev-user'
        }
      })
    );
  }

  if (!token) {
    return next(request);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  };

  if (request.url.startsWith('http://localhost:3000')) {
    headers['X-Local-User-Id'] = 'local-dev-user';
  }

  return next(request.clone({ setHeaders: headers }));
};
