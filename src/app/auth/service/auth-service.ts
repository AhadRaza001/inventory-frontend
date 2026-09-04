import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs';
import { throwError } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { ToastService } from '../../toast/toast-service';
import { environment } from '../../../environments/environment';

@Service()
export class AuthService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}`;
  private http = inject(HttpClient);
  router = inject(Router);
  toast = inject(ToastService);

  login(authinfo: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, authinfo).pipe(
      tap((response: any) => {
        if (response.data) {
          localStorage.setItem('token', response.data.token);
          // 24 hours from now
          const expiryTime = Date.now() + 24 * 60 * 60 * 1000;

          localStorage.setItem('token_expiry', expiryTime.toString());
        }
      }),
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap({
        next: () => {
          this.clearSession();
          this.router.navigate(['/login']);
        },
        error: (err) => console.error('Logout failed:', err),
      }),
    );
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiry');
  }

  getToken(): string | null {
    // Passively expire the token on read if it's past its expiry time
    if (this.isTokenExpired()) {
      this.clearSession();
      return null;
    }
    return localStorage.getItem('token');
  }

  private isTokenExpired(): boolean {
    const expiry = localStorage.getItem('token_expiry');
    if (!expiry) {
      return false;
    }
    return Date.now() > Number(expiry);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  signup(signup: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, signup).pipe(
      tap(() => console.log('signup is successfully')),
      catchError((err) => {
        console.log('this is error from service.', err);
        return throwError(() => err);
      }),
    );
  }
}
