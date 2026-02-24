import { Component, OnInit } from '@angular/core';
import { Rider } from '../types';
import { ScoritoRace } from '../scorito-types';
import { races } from '../races';
import { SelectionService } from '../selection.service';
import { FirestoreService } from '../firestore.service';

@Component({
  selector: 'app-race-planner',
  templateUrl: './race-planner.component.html',
  styleUrls: ['./race-planner.component.css'],
  standalone: false
})
export class RacePlannerComponent implements OnInit {
  races: ScoritoRace[] = races.sort((a, b) => a.StartDate > b.StartDate ? 1 : -1);
  allRiders: Rider[] = [];
  selectedRiders: Rider[] = [];
  raceSelections: { [eventId: number]: number[] } = {};
  raceCaptains: { [eventId: number]: { c1?: number, c2?: number, c3?: number } } = {};

  ridersPerRaceMap: { [eventId: number]: Rider[] } = {};
  private triggerRidersCache: { [eventId: number]: { idsStr: string, riders: Rider[] } } = {};

  private readonly EMPTY_RIDERS: Rider[] = [];
  private readonly EMPTY_RIDER_IDS: number[] = [];

  constructor(
    private selectionService: SelectionService,
    private firestoreService: FirestoreService
  ) { }

  ngOnInit(): void {
    // 1. Subscribe to the 20-man roster
    this.selectionService.selectedRiders$.subscribe(riders => {
      this.selectedRiders = riders;
    });

    // 2. Subscribe to the individual race selections
    this.selectionService.raceSelections$.subscribe(selections => {
      this.raceSelections = selections || {};
    });

    // 3. Subscribe to captain selections
    this.selectionService.raceCaptains$.subscribe(captains => {
      this.raceCaptains = captains || {};
    });

    // 4. Fetch all riders from Firestore
    this.firestoreService.getAllRiders().subscribe((dbRiders) => {
      if (dbRiders && dbRiders.length > 0) {
        this.allRiders = dbRiders.sort((a, b) => b.price - a.price); // sort by highest price
        this.buildRidersPerRaceMap();
      }
    });
  }

  // Optimize performance: compute the eligible riders for each race exactly once
  buildRidersPerRaceMap() {
    this.races.forEach(race => {
      this.ridersPerRaceMap[race.EventId] = this.allRiders.filter(
        rider => rider.races && rider.races[race.EventId] === 1
      );
    });
  }

  getRidersForRace(eventId: number): Rider[] {
    return this.ridersPerRaceMap[eventId] || this.EMPTY_RIDERS;
  }

  // Get the selected Rider IDs for a specific race
  getSelectedRiderIdsForRace(eventId: number): number[] {
    return this.raceSelections[eventId] || this.EMPTY_RIDER_IDS;
  }

  getSortedSelectedRiders(eventId: number): Rider[] {
    const ids = this.getSelectedRiderIdsForRace(eventId);
    if (ids.length === 0 || this.allRiders.length === 0) return this.EMPTY_RIDERS;

    const idsStr = ids.join(',');
    if (this.triggerRidersCache[eventId] && this.triggerRidersCache[eventId].idsStr === idsStr) {
      return this.triggerRidersCache[eventId].riders;
    }

    const riders = ids.map(id => this.allRiders.find(r => r.id === id)).filter(r => !!r) as Rider[];
    riders.sort((a, b) => b.price - a.price);

    this.triggerRidersCache[eventId] = { idsStr, riders };
    return riders;
  }

  onRaceSelectionChange(eventId: number, newSelectionIds: number[]) {
    // Check if new riders were added or removed
    const prevSelection = this.raceSelections[eventId] || [];
    const addedIds = newSelectionIds.filter(id => !prevSelection.includes(id));
    const removedIds = prevSelection.filter(id => !newSelectionIds.includes(id));

    // Deselect from whole squad if removed from this race
    removedIds.forEach(id => {
      const riderObj = this.allRiders.find(r => r.id === id);
      if (riderObj) {
        // Removing from the squad effectively unassigns them from ALL other auto-assigned races
        this.selectionService.removeRider(riderObj);
      }
    });

    addedIds.forEach(id => {
      const riderObj = this.allRiders.find(r => r.id === id);
      if (riderObj) {
        // Add to main selection service. 
        // This will also auto-add them to other races they ride independently.
        if (!this.selectionService.isSelected(riderObj.id)) {
          this.selectionService.addRider(riderObj);
        }
      }
    });

    // Sync state locally
    this.selectionService.updateRaceSelection(eventId, newSelectionIds);
  }

  getCaptainId(eventId: number, captainLevel: 1 | 2 | 3): number | undefined {
    if (!this.raceCaptains[eventId]) return undefined;
    return (this.raceCaptains[eventId] as any)[`c${captainLevel}`];
  }

  onCaptainSelectionChange(eventId: number, captainLevel: 1 | 2 | 3, event: Event) {
    const target = event.target as HTMLSelectElement;
    // Provide numeric riderId, or undefined if value was entirely cleared.
    const val = target.value ? Number(target.value) : undefined;
    this.selectionService.setCaptain(eventId, captainLevel, val);
  }

  getCaptainBgColor(eventId: number, captainLevel: 1 | 2 | 3): string {
    const captainId = this.getCaptainId(eventId, captainLevel);
    if (!captainId) return '#ffffff'; // white if empty

    const rider = this.allRiders.find(r => r.id === captainId);
    if (!rider) return '#ffffff';

    return this.getRiderBgColor(rider);
  }

  get remainingBudget(): number {
    return this.selectionService.remainingBudget;
  }

  getRiderBgColor(rider: Rider): string {
    if (rider.price >= 7000000) return '#FFD700'; // Pure Pogacar Gold

    // Vibrant colors for premium riders 2M and up
    const premiumColors = [
      '#ff7979', '#fada5e', '#48dbfb', '#ff9ff3', '#1dd1a1',
      '#feca57', '#0abde3', '#10ac84', '#ffda79', '#ff9f43'
    ];

    // Faded, muted greys/pastels for under 2M riders
    const basicColors = [
      '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#f1f2f6',
      '#dfe4ea', '#f5f6fa', '#dcdde1', '#c8d6e5', '#ecf0f1'
    ];

    const baseHash = rider.id ? Math.abs(rider.id) : 0;

    if (rider.price >= 2000000) {
      return premiumColors[baseHash % premiumColors.length];
    }
    return basicColors[baseHash % basicColors.length];
  }
}
