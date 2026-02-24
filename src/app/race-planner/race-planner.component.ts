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

    // 3. Fetch all riders from Firestore
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
          this.selectionService.autoAssignRiderToRaces(riderObj.id, riderObj.races);
        }
      }
    });

    // Sync state locally
    this.selectionService.updateRaceSelection(eventId, newSelectionIds);
  }

  get remainingBudget(): number {
    return this.selectionService.remainingBudget;
  }

  getRiderBgColor(rider: Rider): string {
    if (rider.price >= 4000000) {
      return '#ffd700'; // Gold/Yellow
    }
    switch (rider.type) {
      case 'GC': return '#ffb3ba'; // Pastel Pink
      case 'Climber': return '#baffc9'; // Pastel Green
      case 'TT': return '#bae1ff'; // Pastel Blue
      case 'Sprinter': return '#e0f7fa'; // Pastel Cyan
      case 'Attacker': return '#ffdfba'; // Pastel Orange
      case 'Support': return '#e0e0e0'; // Light Grey
      case 'Cobbles': return '#d3b8ae'; // Light Brown
      case 'Hills': return '#cbaacb'; // Pastel Purple
      default: return '#f8f9fa'; // Default Light Grey
    }
  }
}
