import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Rider } from '../types';
import { GrandTourId, GrandTourInfo, StageLineup, TourClassificationPicks } from './grand-tour-types';
import { GRAND_TOURS_DATA, SCORITO_POINTS } from './grand-tour-data';
import { UserTeamService } from '../user-team.service';

@Injectable({
  providedIn: 'root'
})
export class GrandTourService {
  private activeTourIdSource = new BehaviorSubject<GrandTourId>('tour');
  activeTourId$ = this.activeTourIdSource.asObservable();

  private squadSource = new BehaviorSubject<Rider[]>([]);
  squad$ = this.squadSource.asObservable();

  private stageLineupsSource = new BehaviorSubject<{ [stageNum: number]: StageLineup }>({});
  stageLineups$ = this.stageLineupsSource.asObservable();

  private classificationsSource = new BehaviorSubject<TourClassificationPicks>({
    general: {},
    points: {},
    mountain: {},
    youth: {}
  });
  classifications$ = this.classificationsSource.asObservable();

  readonly MAX_SQUAD_RIDERS = 20;
  readonly MAX_STAGE_RIDERS = 9;
  readonly BUDGET_LIMIT = 45000000;

  constructor(private userTeamService: UserTeamService) {
    this.switchTour('tour');

    // Herlaad actieve ronde wanneer gebruiker inlogt of uitlogt
    this.userTeamService.authStateChanged$.subscribe(() => {
      this.loadTourData(this.activeTourId);
    });
  }

  get activeTourId(): GrandTourId {
    return this.activeTourIdSource.value;
  }

  get activeTourInfo(): GrandTourInfo {
    return GRAND_TOURS_DATA[this.activeTourId];
  }

  get squad(): Rider[] {
    return this.squadSource.value;
  }

  get stageLineups(): { [stageNum: number]: StageLineup } {
    return this.stageLineupsSource.value;
  }

  get classifications(): TourClassificationPicks {
    return this.classificationsSource.value;
  }

  get remainingBudget(): number {
    const spent = this.squad.reduce((acc, r) => acc + (Number(r.price) || 0), 0);
    return this.BUDGET_LIMIT - spent;
  }

  switchTour(tourId: GrandTourId) {
    this.activeTourIdSource.next(tourId);
    this.loadTourData(tourId);
  }

  private async loadTourData(tourId: GrandTourId) {
    // 1. Direct uit lokaal geheugen laden voor snelle weergave
    const savedSquad = localStorage.getItem(`gt_${tourId}_squad`);
    if (savedSquad) {
      try {
        this.squadSource.next(JSON.parse(savedSquad));
      } catch {
        this.squadSource.next([]);
      }
    } else {
      this.squadSource.next([]);
    }

    // 2. Etappes laden
    const savedLineups = localStorage.getItem(`gt_${tourId}_stages`);
    if (savedLineups) {
      try {
        this.stageLineupsSource.next(JSON.parse(savedLineups));
      } catch {
        this.initDefaultLineups();
      }
    } else {
      this.initDefaultLineups();
    }

    // 3. Klassementen laden
    const savedClass = localStorage.getItem(`gt_${tourId}_classifications`);
    if (savedClass) {
      try {
        this.classificationsSource.next(JSON.parse(savedClass));
      } catch {
        this.initDefaultClassifications();
      }
    } else {
      this.initDefaultClassifications();
    }

    // 4. Uit Firestore cloud laden als de gebruiker is ingelogd
    try {
      const cloudData = await this.userTeamService.loadGrandTourTeam(tourId);
      if (cloudData && this.activeTourId === tourId) {
        if (cloudData.squad) this.squadSource.next(cloudData.squad);
        if (cloudData.stageLineups) this.stageLineupsSource.next(cloudData.stageLineups);
        if (cloudData.classifications) this.classificationsSource.next(cloudData.classifications);
      }
    } catch (_) {}
  }

  private triggerCloudSync() {
    this.userTeamService.saveGrandTourTeam(this.activeTourId, {
      squad: this.squad,
      stageLineups: this.stageLineups,
      classifications: this.classifications
    });
  }

  private initDefaultLineups() {
    const initial: { [stageNum: number]: StageLineup } = {};
    for (let i = 1; i <= 21; i++) {
      initial[i] = { stageNumber: i, riderIds: [], captainId: null };
    }
    this.stageLineupsSource.next(initial);
  }

  private initDefaultClassifications() {
    this.classificationsSource.next({
      general: {},
      points: {},
      mountain: {},
      youth: {}
    });
  }

  // --- SQUAD MANAGEMENT ---
  addRiderToSquad(rider: Rider): boolean {
    if (this.squad.some(r => r.id === rider.id)) return false;
    if (this.squad.length >= this.MAX_SQUAD_RIDERS) return false;
    if (this.remainingBudget < (Number(rider.price) || 0)) return false;

    const updated = [...this.squad, rider];
    this.squadSource.next(updated);
    this.saveSquad();
    return true;
  }

  removeRiderFromSquad(riderId: number) {
    const updated = this.squad.filter(r => r.id !== riderId);
    this.squadSource.next(updated);
    this.saveSquad();

    // Also remove from all 21 stage lineups
    const lineups = { ...this.stageLineups };
    let modified = false;
    Object.keys(lineups).forEach(key => {
      const num = Number(key);
      if (lineups[num].riderIds.includes(riderId)) {
        lineups[num].riderIds = lineups[num].riderIds.filter(id => id !== riderId);
        if (lineups[num].captainId === riderId) {
          lineups[num].captainId = null;
        }
        modified = true;
      }
    });
    if (modified) {
      this.stageLineupsSource.next(lineups);
      this.saveLineups();
    }

    // Also remove from classification predictions
    this.removeRiderFromClassifications(riderId);
  }

  private saveSquad() {
    localStorage.setItem(`gt_${this.activeTourId}_squad`, JSON.stringify(this.squad));
    this.triggerCloudSync();
  }

  // --- 21 STAGES DAILY LINEUP (9 RIDERS) ---
  toggleRiderInStage(stageNumber: number, riderId: number): boolean {
    const lineups = { ...this.stageLineups };
    if (!lineups[stageNumber]) {
      lineups[stageNumber] = { stageNumber, riderIds: [], captainId: null };
    }

    const currentIds = [...lineups[stageNumber].riderIds];
    const isSelected = currentIds.includes(riderId);

    if (isSelected) {
      // Remove
      lineups[stageNumber].riderIds = currentIds.filter(id => id !== riderId);
      if (lineups[stageNumber].captainId === riderId) {
        lineups[stageNumber].captainId = null;
      }
    } else {
      // Add (up to 9 riders)
      if (currentIds.length >= this.MAX_STAGE_RIDERS) {
        return false;
      }
      lineups[stageNumber].riderIds = [...currentIds, riderId];
      // Automatically set captain if first rider
      if (!lineups[stageNumber].captainId) {
        lineups[stageNumber].captainId = riderId;
      }
    }

    this.stageLineupsSource.next(lineups);
    this.saveLineups();
    return true;
  }

  setStageCaptain(stageNumber: number, riderId: number | null) {
    const lineups = { ...this.stageLineups };
    if (!lineups[stageNumber]) return;

    // Captain must be in the 9-rider lineup
    if (riderId && !lineups[stageNumber].riderIds.includes(riderId)) {
      return;
    }

    lineups[stageNumber].captainId = riderId;
    this.stageLineupsSource.next(lineups);
    this.saveLineups();
  }

  private saveLineups() {
    localStorage.setItem(`gt_${this.activeTourId}_stages`, JSON.stringify(this.stageLineups));
    this.triggerCloudSync();
  }

  // --- CLASSIFICATIONS PREDICTION ---
  setClassificationRider(category: 'general' | 'points' | 'mountain' | 'youth', position: number, riderId: number | null) {
    const current = { ...this.classifications };
    const categoryMap = { ...current[category] };

    // If rider was already assigned to another position in this classification, remove them from that position
    if (riderId) {
      Object.keys(categoryMap).forEach(key => {
        if (categoryMap[Number(key)] === riderId) {
          delete categoryMap[Number(key)];
        }
      });
    }

    if (riderId === null) {
      delete categoryMap[position];
    } else {
      categoryMap[position] = riderId;
    }

    current[category] = categoryMap;
    this.classificationsSource.next(current);
    this.saveClassifications();
  }

  private removeRiderFromClassifications(riderId: number) {
    const current = { ...this.classifications };
    let modified = false;

    (['general', 'points', 'mountain', 'youth'] as const).forEach(cat => {
      const map = { ...current[cat] };
      Object.keys(map).forEach(pos => {
        if (map[Number(pos)] === riderId) {
          delete map[Number(pos)];
          modified = true;
        }
      });
      current[cat] = map;
    });

    if (modified) {
      this.classificationsSource.next(current);
      this.saveClassifications();
    }
  }

  private saveClassifications() {
    localStorage.setItem(`gt_${this.activeTourId}_classifications`, JSON.stringify(this.classifications));
    this.triggerCloudSync();
  }

  // Calculate estimated classification points scored by riders who are in your squad
  calculateEstimatedClassificationPoints(): number {
    let total = 0;
    const squadIds = new Set(this.squad.map(r => r.id));

    // General Classification points
    SCORITO_POINTS.general.forEach(tier => {
      const riderId = this.classifications.general[tier.position];
      if (riderId && squadIds.has(riderId)) {
        total += tier.points;
      }
    });

    // Points Classification points
    SCORITO_POINTS.points.forEach(tier => {
      const riderId = this.classifications.points[tier.position];
      if (riderId && squadIds.has(riderId)) {
        total += tier.points;
      }
    });

    // Mountain Classification points
    SCORITO_POINTS.mountain.forEach(tier => {
      const riderId = this.classifications.mountain[tier.position];
      if (riderId && squadIds.has(riderId)) {
        total += tier.points;
      }
    });

    // Youth Classification points
    SCORITO_POINTS.youth.forEach(tier => {
      const riderId = this.classifications.youth[tier.position];
      if (riderId && squadIds.has(riderId)) {
        total += tier.points;
      }
    });

    return total;
  }

  // Count how many stages a rider is included in
  getRiderStageCount(riderId: number): number {
    let count = 0;
    const lineups = this.stageLineups;
    Object.values(lineups).forEach(l => {
      if (l.riderIds && l.riderIds.includes(riderId)) {
        count++;
      }
    });
    return count;
  }
}
