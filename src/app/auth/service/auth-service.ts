import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs';
import { throwError } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { ToastService } from '../../toast/toast-service';

@Service()
export class AuthService {
  private baseUrl = 'http://localhost:8000/api';
  private http = inject(HttpClient);
  router = inject(Router);
toast = inject(ToastService);
  login(authinfo: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, authinfo).pipe(
      tap((response: any) => {
        if (response.data) {
          localStorage.setItem('token', response.data.token);
        }
      }),
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap({
        next: () => {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        },
        error: (err) => console.error('Logout failed:', err),
      }),
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  signup(signup:any):Observable<any>{
    return this.http.post(`${this.baseUrl}/signup`,signup).pipe(tap(()=>console.log('signup is successfully')),
    catchError((err)=>{
      console.log('this is error from service.',err);
      return throwError(()=>err);

    })
    )

  }
}
