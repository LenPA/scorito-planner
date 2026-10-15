import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Firestore, doc, setDoc, docData, increment } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface VisitorStats {
  totalPageViews?: number;
  totalSessions?: number;
  lastVisitAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly measurementId = environment.firebase.measurementId;

  constructor(
    private router: Router,
    private firestore: Firestore,
    private injector: Injector
  ) {
    this.initPageTracking();
    this.recordFirestoreVisit();
  }

  /**
   * Listens to Angular Router navigation events and triggers a Google Analytics page_view
   * on every route transition (Single Page Application support).
   */
  private initPageTracking(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  /**
   * Manually track a pageview in Google Analytics.
   */
  public trackPageView(url: string, title?: string): void {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: url,
        page_title: title || document.title,
        page_location: window.location.href,
        send_to: this.measurementId
      });
    }
  }

  /**
   * Track custom user interaction events (e.g. rider selection, captain assignment).
   */
  public trackEvent(eventName: string, params: Record<string, any> = {}): void {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  }

  /**
   * Increments the pageview and session count directly in Firestore metadata/analytics
   * so visitor numbers can be viewed instantly without waiting for external dashboards.
   */
  private async recordFirestoreVisit(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;

      const statsDoc = doc(this.firestore, 'metadata/analytics');
      const isNewSession = !sessionStorage.getItem('sp_session_recorded');

      const payload: Record<string, any> = {
        ["totalPageViews"]: increment(1),
        ["lastVisitAt"]: new Date().toISOString()
      };

      if (isNewSession) {
        payload["totalSessions"] = increment(1);
        try {
          sessionStorage.setItem('sp_session_recorded', 'true');
        } catch (_) {}
      }

      await setDoc(statsDoc, payload, { merge: true });
    } catch (err) {
      // Non-blocking: fail gracefully if offline or permissions are restricted
      console.warn('Analytics visit recording skipped:', err);
    }
  }

  /**
   * Observable to get real-time visitor statistics from Firestore.
   */
  public getVisitorStats(): Observable<VisitorStats | undefined> {
    return runInInjectionContext(this.injector, () => {
      const statsDoc = doc(this.firestore, 'metadata/analytics');
      return docData(statsDoc) as Observable<VisitorStats | undefined>;
    });
  }
}
