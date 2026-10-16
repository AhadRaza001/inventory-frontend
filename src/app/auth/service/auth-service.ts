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

  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  // =========================================================
  // LOGIN
  // =========================================================

  login(authinfo: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, authinfo).pipe(
      tap((response: any) => {
        if (!response?.data?.token) {
          return;
        }

        const token = response.data.token;

        // Token expires after 24 hours
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000;

        // Save token
        localStorage.setItem('token', token);

        // Save expiry timestamp
        localStorage.setItem('token_expiry', expiryTime.toString());

        // Start automatic expiry timer
        this.startExpiryTimer(expiryTime);
      }),

      catchError((error) => {
        console.error('Login failed:', error);

        return throwError(() => error);
      }),
    );
  }

  // =========================================================
  // START TOKEN EXPIRY TIMER
  // =========================================================

  private startExpiryTimer(expiryTime: number): void {
    // Remove any previous timer
    this.clearExpiryTimer();

    const timeUntilExpiry = expiryTime - Date.now();

    console.log('Token will expire in:', Math.round(timeUntilExpiry / 1000), 'seconds');

    // Already expired
    if (timeUntilExpiry <= 0) {
      this.handleTokenExpiry();
      return;
    }

    // Schedule automatic logout
    this.expiryTimer = setTimeout(() => {
      console.log('Token expired');

      this.handleTokenExpiry();
    }, timeUntilExpiry);
  }

  // =========================================================
  // HANDLE TOKEN EXPIRY
  // =========================================================

  private handleTokenExpiry(): void {
    console.log('Session expired');

    // Remove local session
    this.clearSession();

    // Redirect to login
    this.router.navigate(['/login']);
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap({
        next: () => {
          console.log('Logout successful');

          this.clearSession();

          this.router.navigate(['/login']);
        },

        error: (error) => {
          console.error('Logout API failed:', error);

          // Even if backend logout fails,
          // remove local authentication.
          this.clearSession();

          this.router.navigate(['/login']);
        },
      }),
    );
  }

  // =========================================================
  // CLEAR SESSION
  // =========================================================

  private clearSession(): void {
    this.clearExpiryTimer();

    localStorage.removeItem('token');

    localStorage.removeItem('token_expiry');
  }

  // =========================================================
  // CLEAR TIMER
  // =========================================================

  private clearExpiryTimer(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);

      this.expiryTimer = null;
    }
  }

  // =========================================================
  // GET TOKEN
  // =========================================================

  getToken(): string | null {
    const token = localStorage.getItem('token');

    if (!token) {
      return null;
    }

    // Check expiry every time token is requested
    if (this.isTokenExpired()) {
      console.log('Token has expired');

      this.clearSession();

      return null;
    }

    return token;
  }

  // =========================================================
  // CHECK TOKEN EXPIRY
  // =========================================================

  private isTokenExpired(): boolean {
    const expiry = localStorage.getItem('token_expiry');

    // No expiry information
    if (!expiry) {
      // Since token exists but expiry doesn't,
      // consider the session invalid.
      return true;
    }

    const expiryTime = Number(expiry);

    // Invalid expiry value
    if (Number.isNaN(expiryTime)) {
      return true;
    }

    return Date.now() >= expiryTime;
  }

  // =========================================================
  // CHECK LOGIN STATUS
  // =========================================================

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // =========================================================
  // RESTORE TIMER AFTER PAGE REFRESH
  // =========================================================

  restoreSession(): void {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('token_expiry');

    // Nothing stored
    if (!token || !expiry) {
      this.clearSession();

      return;
    }

    const expiryTime = Number(expiry);

    // Already expired while browser was closed
    if (Date.now() >= expiryTime) {
      console.log('Stored session has expired');

      this.clearSession();

      return;
    }

    // Token is still valid.
    // Restart timer.
    this.startExpiryTimer(expiryTime);
  }

  // =========================================================
  // SIGNUP
  // =========================================================

  signup(signup: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, signup).pipe(
      tap(() => {
        console.log('Signup successful');
      }),

      catchError((error) => {
        console.error('Signup failed:', error);

        return throwError(() => error);
      }),
    );
  }
}
