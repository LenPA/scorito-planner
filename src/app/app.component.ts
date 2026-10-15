import { Component } from '@angular/core';
import { AnalyticsService } from './analytics.service';
import { AuthService } from './auth/auth.service';
import { UserTeamService, SyncState } from './user-team.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
  title = 'scorito-planner';
  isAuthModalOpen: boolean = false;
  isProfileMenuOpen: boolean = false;
  syncStatus$: Observable<SyncState>;

  constructor(
    private analytics: AnalyticsService,
    public auth: AuthService,
    private userTeam: UserTeamService
  ) {
    this.syncStatus$ = this.userTeam.syncStatus$;
  }

  openAuthModal() {
    this.isAuthModalOpen = true;
    this.isProfileMenuOpen = false;
  }

  closeAuthModal() {
    this.isAuthModalOpen = false;
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  async logout() {
    this.isProfileMenuOpen = false;
    await this.auth.signOut();
  }

  copyUid(uid: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(uid);
      alert('User UID gekopieerd naar klembord: ' + uid);
    }
  }
}
