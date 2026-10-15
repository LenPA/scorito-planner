import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { AuthService } from './auth/auth.service';
import { Rider } from './types';
import { GrandTourId, StageLineup, TourClassificationPicks } from './grand-tour/grand-tour-types';

export type CompetitionType = 'classics' | GrandTourId;

export interface ClassicsTeamData {
  competitionId?: 'classics';
  selectedRiders: Rider[];
  raceSelections: { [eventId: number]: number[] };
  raceCaptains: { [eventId: number]: { c1?: number; c2?: number; c3?: number } };
  mustHaveIds: number[];
  updatedAt: string;
}

export interface GrandTourTeamData {
  competitionId?: GrandTourId;
  squad: Rider[];
  stageLineups: { [stageNum: number]: StageLineup };
  classifications: TourClassificationPicks;
  updatedAt: string;
}

export type SyncState = 'saved' | 'saving' | 'guest';

@Injectable({
  providedIn: 'root'
})
export class UserTeamService {
  private syncStatusSource = new BehaviorSubject<SyncState>('guest');
  public syncStatus$ = this.syncStatusSource.asObservable();

  // Emits when a user logs in or out so services can re-sync their data
  private authStateChangedSource = new Subject<boolean>();
  public authStateChanged$ = this.authStateChangedSource.asObservable();

  private classicsDebounceTimer: any = null;
  private tourDebounceTimers: { [tourId: string]: any } = {};

  constructor(
    private firestore: Firestore,
    private auth: AuthService
  ) {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.syncStatusSource.next('saved');
      } else {
        this.syncStatusSource.next('guest');
      }
      this.authStateChangedSource.next(!!user);
    });
  }

  get syncStatus(): SyncState {
    return this.syncStatusSource.value;
  }

  // ==========================================
  // KLASSIEKERS (Voorjaarsklassiekers)
  // ==========================================

  async loadClassicsTeam(): Promise<ClassicsTeamData | null> {
    const userId = this.auth.userId;
    if (!userId) {
      // Gastmodus: laad uit localStorage
      return this.loadClassicsFromStorage();
    }

    try {
      const teamDocRef = doc(this.firestore, `users/${userId}/teams/classics`);
      const snapshot = await getDoc(teamDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as ClassicsTeamData;
        // Werk ook lokale cache bij voor offline continuïteit
        this.saveClassicsToStorage(data);
        this.syncStatusSource.next('saved');
        return data;
      } else {
        // Document bestaat nog niet in cloud: migreer huidige lokale data naar Firestore!
        const localData = this.loadClassicsFromStorage();
        if (localData && (localData.selectedRiders?.length > 0 || Object.keys(localData.raceSelections || {}).length > 0)) {
          await this.saveClassicsTeam(localData);
          return localData;
        }
        return null;
      }
    } catch (err) {
      console.warn('Fout bij ophalen klassiekers team uit cloud, fallback naar lokaal:', err);
      return this.loadClassicsFromStorage();
    }
  }

  saveClassicsTeam(data: {
    selectedRiders: Rider[];
    raceSelections: { [eventId: number]: number[] };
    raceCaptains: { [eventId: number]: { c1?: number; c2?: number; c3?: number } };
    mustHaveIds: number[];
  }): void {
    const teamData: ClassicsTeamData = {
      ...data,
      competitionId: 'classics',
      updatedAt: new Date().toISOString()
    };

    // Altijd direct lokaal cachen
    this.saveClassicsToStorage(teamData);

    const userId = this.auth.userId;
    if (!userId) {
      this.syncStatusSource.next('guest');
      return;
    }

    // Debounced opslaan in Firestore
    this.syncStatusSource.next('saving');
    if (this.classicsDebounceTimer) {
      clearTimeout(this.classicsDebounceTimer);
    }

    this.classicsDebounceTimer = setTimeout(async () => {
      try {
        const teamDocRef = doc(this.firestore, `users/${userId}/teams/classics`);
        await setDoc(teamDocRef, teamData, { merge: true });
        this.syncStatusSource.next('saved');
      } catch (err) {
        console.error('Fout bij opslaan klassiekers team in Firestore:', err);
        this.syncStatusSource.next('saved');
      }
    }, 700);
  }

  private loadClassicsFromStorage(): ClassicsTeamData | null {
    try {
      const riders = localStorage.getItem('default');
      const selections = localStorage.getItem('default_race_selections');
      const captains = localStorage.getItem('default_race_captains');
      const mustHaves = localStorage.getItem('default_must_haves');

      return {
        selectedRiders: riders ? JSON.parse(riders) : [],
        raceSelections: selections ? JSON.parse(selections) : {},
        raceCaptains: captains ? JSON.parse(captains) : {},
        mustHaveIds: mustHaves ? JSON.parse(mustHaves) : [],
        updatedAt: new Date().toISOString()
      };
    } catch {
      return null;
    }
  }

  private saveClassicsToStorage(data: ClassicsTeamData): void {
    try {
      localStorage.setItem('default', JSON.stringify(data.selectedRiders || []));
      localStorage.setItem('default_race_selections', JSON.stringify(data.raceSelections || {}));
      localStorage.setItem('default_race_captains', JSON.stringify(data.raceCaptains || {}));
      localStorage.setItem('default_must_haves', JSON.stringify(data.mustHaveIds || []));
    } catch (_) {}
  }

  // ==========================================
  // GROTE RONDES (Giro, Tour, Vuelta)
  // ==========================================

  async loadGrandTourTeam(tourId: GrandTourId): Promise<GrandTourTeamData | null> {
    const userId = this.auth.userId;
    if (!userId) {
      return this.loadGrandTourFromStorage(tourId);
    }

    try {
      const teamDocRef = doc(this.firestore, `users/${userId}/teams/${tourId}`);
      const snapshot = await getDoc(teamDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as GrandTourTeamData;
        this.saveGrandTourToStorage(tourId, data);
        this.syncStatusSource.next('saved');
        return data;
      } else {
        // Document bestaat nog niet in cloud: migreer lokale data naar Firestore
        const localData = this.loadGrandTourFromStorage(tourId);
        if (localData && localData.squad?.length > 0) {
          await this.saveGrandTourTeam(tourId, localData);
          return localData;
        }
        return null;
      }
    } catch (err) {
      console.warn(`Fout bij ophalen ${tourId} team uit cloud, fallback naar lokaal:`, err);
      return this.loadGrandTourFromStorage(tourId);
    }
  }

  saveGrandTourTeam(
    tourId: GrandTourId,
    data: {
      squad: Rider[];
      stageLineups: { [stageNum: number]: StageLineup };
      classifications: TourClassificationPicks;
    }
  ): void {
    const teamData: GrandTourTeamData = {
      ...data,
      competitionId: tourId,
      updatedAt: new Date().toISOString()
    };

    // Altijd direct lokaal cachen
    this.saveGrandTourToStorage(tourId, teamData);

    const userId = this.auth.userId;
    if (!userId) {
      this.syncStatusSource.next('guest');
      return;
    }

    // Debounced opslaan in Firestore
    this.syncStatusSource.next('saving');
    if (this.tourDebounceTimers[tourId]) {
      clearTimeout(this.tourDebounceTimers[tourId]);
    }

    this.tourDebounceTimers[tourId] = setTimeout(async () => {
      try {
        const teamDocRef = doc(this.firestore, `users/${userId}/teams/${tourId}`);
        await setDoc(teamDocRef, teamData, { merge: true });
        this.syncStatusSource.next('saved');
      } catch (err) {
        console.error(`Fout bij opslaan ${tourId} team in Firestore:`, err);
        this.syncStatusSource.next('saved');
      }
    }, 700);
  }

  private loadGrandTourFromStorage(tourId: GrandTourId): GrandTourTeamData | null {
    try {
      const savedSquad = localStorage.getItem(`gt_${tourId}_squad`);
      const savedStages = localStorage.getItem(`gt_${tourId}_stages`);
      const savedClass = localStorage.getItem(`gt_${tourId}_classifications`);

      return {
        squad: savedSquad ? JSON.parse(savedSquad) : [],
        stageLineups: savedStages ? JSON.parse(savedStages) : {},
        classifications: savedClass ? JSON.parse(savedClass) : { general: {}, points: {}, mountain: {}, youth: {} },
        updatedAt: new Date().toISOString()
      };
    } catch {
      return null;
    }
  }

  private saveGrandTourToStorage(tourId: GrandTourId, data: GrandTourTeamData): void {
    try {
      localStorage.setItem(`gt_${tourId}_squad`, JSON.stringify(data.squad || []));
      localStorage.setItem(`gt_${tourId}_stages`, JSON.stringify(data.stageLineups || {}));
      localStorage.setItem(`gt_${tourId}_classifications`, JSON.stringify(data.classifications || { general: {}, points: {}, mountain: {}, youth: {} }));
    } catch (_) {}
  }
}
