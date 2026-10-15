import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  User,
  UserCredential,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public readonly user$: Observable<User | null>;
  public readonly isAdmin$: Observable<boolean>;
  private _currentUser: User | null = null;
  private _isAdmin: boolean = false;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private injector: Injector
  ) {
    this.user$ = runInInjectionContext(this.injector, () => {
      return authState(this.auth).pipe(shareReplay(1));
    });

    this.user$.subscribe(user => {
      this._currentUser = user;
    });

    this.isAdmin$ = this.user$.pipe(
      switchMap(user => from(this.checkIfAdmin(user))),
      shareReplay(1)
    );

    this.isAdmin$.subscribe(isAdmin => {
      this._isAdmin = isAdmin;
    });
  }

  private async checkIfAdmin(user: User | null): Promise<boolean> {
    if (!user || !user.email) return false;

    const email = user.email.toLowerCase().trim();
    const configuredAdmins = (environment.adminEmails || []).map(e => e.toLowerCase().trim());

    // 1. Direct check in environment.ts / environment.prod.ts
    if (configuredAdmins.includes(email)) {
      return true;
    }

    // 2. Dynamic check in Firestore 'admins' collection (by email or UID)
    try {
      const emailDoc = await getDoc(doc(this.firestore, `admins/${email}`));
      if (emailDoc.exists()) return true;

      const uidDoc = await getDoc(doc(this.firestore, `admins/${user.uid}`));
      if (uidDoc.exists()) return true;
    } catch (_) {}

    return false;
  }

  get currentUser(): User | null {
    return this._currentUser || this.auth.currentUser;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this._isAdmin;
  }

  get userId(): string | null {
    return this.currentUser ? this.currentUser.uid : null;
  }

  get userEmail(): string | null {
    return this.currentUser ? this.currentUser.email : null;
  }

  async signUp(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email.trim(), password);
  }

  async signIn(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email.trim(), password);
  }

  async signOut(): Promise<void> {
    return signOut(this.auth);
  }

  async sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email.trim());
  }

  /**
   * Converteert Firebase Auth foutcodes naar gebruiksvriendelijke Nederlandse meldingen.
   */
  public getErrorMessage(error: any): string {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Ongeldig e-mailadres.';
      case 'auth/user-not-found':
        return 'Geen account gevonden met dit e-mailadres.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Onjuist e-mailadres of wachtwoord.';
      case 'auth/email-already-in-use':
        return 'Dit e-mailadres is al geregistreerd. Log direct in.';
      case 'auth/weak-password':
        return 'Kies een sterker wachtwoord (minimaal 6 tekens).';
      case 'auth/too-many-requests':
        return 'Te veel mislukte pogingen. Probeer het over een paar minuten opnieuw.';
      case 'auth/network-request-failed':
        return 'Netwerkfout. Controleer je internetverbinding.';
      default:
        return error?.message || 'Er is een fout opgetreden bij het inloggen.';
    }
  }
}
