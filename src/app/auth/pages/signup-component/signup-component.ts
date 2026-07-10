import { Component, inject, signal } from '@angular/core';
import { ToastService } from '../../../toast/toast-service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../service/auth-service';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { single } from 'rxjs';
import { email, form, minLength, required } from '@angular/forms/signals';
@Component({
  selector: 'app-signup-component',
  imports: [
    FormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    CheckboxModule,
    ButtonModule,
  ],
  templateUrl: './signup-component.html',
  styleUrl: './signup-component.css',
})
export class SignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  signup = signal({
    name: '',
    email: '',
    password: '',
  });

  signupForm = form(this.signup, (schema) => {
    // Name
    required(schema.name, {
      when: ({ state }) => state.touched(),
      message: 'Name is required.',
    });

    // Email
    required(schema.email, {
      when: ({ state }) => state.touched(),
      message: 'Email is required.',
    });

    email(schema.email, {
      when: ({ state }) => state.touched(),
      message: 'Please enter a valid email address.',
    });
    // Password
    required(schema.password, {
      when: ({ state }) => state.touched(),
      message: 'Password is required.',
    });

    minLength(schema.password, 8, {
      when: ({ state }) => state.touched(),
      message: 'Password must be at least 8 characters long.',
    });
  });
  acceptedTerms = false;

  showPassword = signal(false);

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }
  onSubmit() {
    if (!this.acceptedTerms) {
      this.toast.error('Please accept the Terms and Conditions.');
      return;
    }
    const formValue = this.signupForm().value();

    this.authService.signup(formValue).subscribe({
      next: () => {
        this.toast.success('Account created successfully.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        if (err.status === 422) {
          const errors = err.error.errors;
          Object.values(errors).forEach((messages: any) => {
            messages.forEach((message: string) => {
              this.toast.error(message);
            });
          });
        }
      },
    });
  }
}
