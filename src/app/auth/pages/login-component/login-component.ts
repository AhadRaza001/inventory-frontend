import { Component, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthService } from '../../service/auth-service';
import { form } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../toast/toast-service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-component',
  imports: [CardModule, ButtonModule, InputTextModule, FloatLabelModule,InputIconModule,IconFieldModule,FormsModule,RouterLink],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})  
export class LoginComponent {
  authservice = inject(AuthService);
    toast = inject(ToastService);
    router = inject(Router);
  login = signal({
    email: '',
    password: '',
  });

  loginform = form(this.login);
  submit(){
   const formValue = this.loginform().value();
this.authservice.login(formValue).subscribe({
    next: (response: any) => {
        this.router.navigate(['/']);
        this.toast.success('Login Successfully.');
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(err.error?.message ?? 'Something went wrong');
      },
})
  }
}
