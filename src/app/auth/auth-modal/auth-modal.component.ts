import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css'],
  standalone: false
})
export class AuthModalComponent {
  @Input() isOpen: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  mode: 'login' | 'register' | 'forgot' = 'login';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private auth: AuthService) {}

  switchMode(newMode: 'login' | 'register' | 'forgot') {
    this.mode = newMode;
    this.errorMessage = null;
    this.successMessage = null;
  }

  close() {
    this.isOpen = false;
    this.errorMessage = null;
    this.successMessage = null;
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop-custom')) {
      this.close();
    }
  }

  async onSubmit() {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.email || !this.email.includes('@')) {
      this.errorMessage = 'Voer een geldig e-mailadres in.';
      return;
    }

    if (this.mode === 'forgot') {
      this.isLoading = true;
      try {
        await this.auth.sendPasswordReset(this.email);
        this.successMessage = 'Er is een e-mail verzonden om je wachtwoord te herstellen. Controleer je inbox.';
      } catch (err: any) {
        this.errorMessage = this.auth.getErrorMessage(err);
      } finally {
        this.isLoading = false;
      }
      return;
    }

    if (!this.password || this.password.length < 6) {
      this.errorMessage = 'Het wachtwoord moet minimaal 6 tekens bevatten.';
      return;
    }

    if (this.mode === 'register' && this.password !== this.confirmPassword) {
      this.errorMessage = 'De ingevoerde wachtwoorden komen niet overeen.';
      return;
    }

    this.isLoading = true;
    try {
      if (this.mode === 'login') {
        await this.auth.signIn(this.email, this.password);
        this.close();
      } else if (this.mode === 'register') {
        await this.auth.signUp(this.email, this.password);
        this.close();
      }
    } catch (err: any) {
      this.errorMessage = this.auth.getErrorMessage(err);
    } finally {
      this.isLoading = false;
    }
  }
}
