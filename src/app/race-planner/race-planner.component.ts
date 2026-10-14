import { Component, OnInit } from '@angular/core';
import { Rider } from '../types';
import { ScoritoRace } from '../scorito-types';
import { races } from '../races';
import { SelectionService } from '../selection.service';
import { FirestoreService } from '../firestore.service';

export interface MustHaveTier {
  name: string;
  badge: string;
  badgeClass: string;
  description: string;
  riderIds: number[];
}

@Component({
  selector: 'app-race-planner',
  templateUrl: './race-planner.component.html',
  styleUrls: ['./race-planner.component.css'],
  standalone: false
})
export class RacePlannerComponent implements OnInit {
  races: ScoritoRace[] = races.sort((a, b) => a.StartDate > b.StartDate ? 1 : -1);
  allRiders: Rider[] = [];
  filteredPelotonRiders: Rider[] = [];
  selectedRiders: Rider[] = [];
  raceSelections: { [eventId: number]: number[] } = {};
  raceCaptains: { [eventId: number]: { c1?: number, c2?: number, c3?: number } } = {};
  mustHaveIds: number[] = [];

  activeTab: 'races' | 'musthaves' | 'matrix' | 'squad' = 'races';
  selectedRaceIndex: number = 0;

  // Search and filter in peloton
  searchQuery: string = '';
  qualityFilter: string = 'all';
  sortBy: 'price_desc' | 'price_asc' | 'races_desc' | 'name' = 'price_desc';

  // Must-haves filter
  mustHaveFilter: 'all' | 'in_squad' | 'not_in_squad' | 'cobbles' | 'hills' = 'all';

  // Predefined curated high-profile classics riders for smart suggestions
  readonly curatedMustHaveIds: number[] = [
    // Top Tier Classics stars (Pogacar, VDP, WVA, Pedersen, Philipsen, Remco, De Lie, Laporte, Küng, Mohoric, Pidcock, etc.)
  ];

  constructor(
    public selectionService: SelectionService,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    // 1. Subscribe to selected 20 riders
    this.selectionService.selectedRiders$.subscribe(riders => {
      this.selectedRiders = riders;
    });

    // 2. Subscribe to race selections
    this.selectionService.raceSelections$.subscribe(selections => {
      this.raceSelections = selections || {};
    });

    // 3. Subscribe to captains
    this.selectionService.raceCaptains$.subscribe(captains => {
      this.raceCaptains = captains || {};
    });

    // 4. Subscribe to must have IDs
    this.selectionService.mustHaveIds$.subscribe(ids => {
      this.mustHaveIds = ids || [];
    });

    // 5. Fetch all riders from Firestore
    this.firestoreService.getAllRiders().subscribe(dbRiders => {
      if (dbRiders && dbRiders.length > 0) {
        this.allRiders = dbRiders.sort((a, b) => b.price - a.price);
        this.selectionService.syncWithDatabase(this.allRiders);

        // Auto-seed recommended must-haves if user has none saved yet
        if (this.mustHaveIds.length === 0) {
          const defaultTop = this.allRiders.filter(r => r.price >= 3500000).map(r => r.id);
          defaultTop.forEach(id => this.selectionService.toggleMustHave(id));
        }

        this.applyPelotonFilters();
      }
    });
  }

  get activeRace(): ScoritoRace {
    return this.races[this.selectedRaceIndex] || this.races[0];
  }

  goToPrevRace() {
    if (this.selectedRaceIndex > 0) {
      this.selectedRaceIndex--;
    }
  }

  goToNextRace() {
    if (this.selectedRaceIndex < this.races.length - 1) {
      this.selectedRaceIndex++;
    }
  }

  // --- CAPTAINS LOGIC ---
  getCaptainId(eventId: number, level: 1 | 2 | 3): number | undefined {
    if (!this.raceCaptains[eventId]) return undefined;
    return (this.raceCaptains[eventId] as any)[`c${level}`];
  }

  getCaptainRider(eventId: number, level: 1 | 2 | 3): Rider | undefined {
    const id = this.getCaptainId(eventId, level);
    if (!id) return undefined;
    return this.allRiders.find(r => r.id === id);
  }

  setCaptain(eventId: number, level: 1 | 2 | 3, riderId: number | undefined) {
    this.selectionService.setCaptain(eventId, level, riderId);
  }

  isRiderCaptainInRace(eventId: number, riderId: number): 1 | 2 | 3 | null {
    if (!this.raceCaptains[eventId]) return null;
    if (this.raceCaptains[eventId].c1 === riderId) return 1;
    if (this.raceCaptains[eventId].c2 === riderId) return 2;
    if (this.raceCaptains[eventId].c3 === riderId) return 3;
    return null;
  }

  // Cycle captain status on matrix click
  cycleCaptainInMatrix(eventId: number, rider: Rider) {
    const isSelected = this.isRiderInRace(eventId, rider.id);
    if (!isSelected) {
      // First toggle into race
      this.toggleRiderInRace(eventId, rider.id);
      return;
    }

    const currentCap = this.isRiderCaptainInRace(eventId, rider.id);
    if (currentCap === null) {
      // Make 1st captain
      this.setCaptain(eventId, 1, rider.id);
    } else if (currentCap === 1) {
      // Make 2nd captain
      this.setCaptain(eventId, 2, rider.id);
    } else if (currentCap === 2) {
      // Make 3rd captain
      this.setCaptain(eventId, 3, rider.id);
    } else {
      // Clear captaincy (remains regular starter)
      this.setCaptain(eventId, 3, undefined);
    }
  }

  // --- SQUAD & RACE PARTICIPATION ---
  isRiderInSquad(riderId: number): boolean {
    return this.selectedRiders.some(r => r.id === riderId);
  }

  toggleSquadRider(rider: Rider) {
    if (this.isRiderInSquad(rider.id)) {
      this.selectionService.removeRider(rider);
    } else {
      if (this.selectedRiders.length < 20 && this.selectionService.remainingBudget >= rider.price) {
        this.selectionService.addRider(rider);
      }
    }
  }

  isRiderInRace(eventId: number, riderId: number): boolean {
    return !!(this.raceSelections[eventId] && this.raceSelections[eventId].includes(riderId));
  }

  toggleRiderInRace(eventId: number, riderId: number) {
    const current = this.raceSelections[eventId] || [];
    let updated: number[];
    if (current.includes(riderId)) {
      updated = current.filter(id => id !== riderId);
    } else {
      updated = [...current, riderId];
    }
    this.selectionService.updateRaceSelection(eventId, updated);
  }

  getRidersSelectedForRace(eventId: number): Rider[] {
    const ids = this.raceSelections[eventId] || [];
    return ids.map(id => this.allRiders.find(r => r.id === id)).filter(r => !!r) as Rider[];
  }

  getSquadRidersForActiveRace(): Rider[] {
    return this.selectedRiders.filter(r => this.isRiderInRace(this.activeRace.EventId, r.id));
  }

  getRiderRaceCount(rider: Rider): number {
    if (!rider.races) return 0;
    return Object.values(rider.races).filter(val => val === 1).length;
  }

  getCaptainsFilledCount(): number {
    let count = 0;
    this.races.forEach(r => {
      const caps = this.raceCaptains[r.EventId];
      if (caps && caps.c1 && caps.c2 && caps.c3) {
        count++;
      }
    });
    return count;
  }

  // --- MUST HAVES SECTION ---
  toggleMustHave(riderId: number) {
    this.selectionService.toggleMustHave(riderId);
  }

  isMustHave(riderId: number): boolean {
    return this.selectionService.isMustHave(riderId);
  }

  get mustHaveRidersList(): Rider[] {
    return this.allRiders.filter(r => this.isMustHave(r.id));
  }

  get filteredMustHaveRiders(): Rider[] {
    let list = this.mustHaveRidersList;

    if (this.mustHaveFilter === 'in_squad') {
      list = list.filter(r => this.isRiderInSquad(r.id));
    } else if (this.mustHaveFilter === 'not_in_squad') {
      list = list.filter(r => !this.isRiderInSquad(r.id));
    } else if (this.mustHaveFilter === 'cobbles') {
      list = list.filter(r => r.qualities && r.qualities['Cobbles'] > 0);
    } else if (this.mustHaveFilter === 'hills') {
      list = list.filter(r => r.qualities && (r.qualities['Hill'] > 0 || r.qualities['Climb'] > 0));
    }

    return list.sort((a, b) => b.price - a.price);
  }

  get mustHavesInSquadCount(): number {
    return this.mustHaveRidersList.filter(r => this.isRiderInSquad(r.id)).length;
  }

  get mustHavesBudgetSpent(): number {
    return this.mustHaveRidersList
      .filter(r => this.isRiderInSquad(r.id))
      .reduce((sum, r) => sum + r.price, 0);
  }

  // --- FILTERING & SEARCH ---
  applyPelotonFilters() {
    let result = [...this.allRiders];

    // Search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(r =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(query) ||
        (r.team?.name && r.team.name.toLowerCase().includes(query)) ||
        (r.team?.shortName && r.team.shortName.toLowerCase().includes(query))
      );
    }

    // Quality filter
    if (this.qualityFilter !== 'all') {
      result = result.filter(r => r.qualities && r.qualities[this.qualityFilter] > 0);
    }

    // Sort
    if (this.sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'races_desc') {
      result.sort((a, b) => this.getRiderRaceCount(b) - this.getRiderRaceCount(a));
    } else if (this.sortBy === 'name') {
      result.sort((a, b) => a.lastName.localeCompare(b.lastName));
    }

    this.filteredPelotonRiders = result;
  }

  formatPrice(price: number): string {
    if (!price && price !== 0) return '€0';
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  }

  getRaceBadgeClass(desc: string): string {
    const d = (desc || '').toLowerCase();
    if (d.includes('cobble')) return 'badge-cobbles';
    if (d.includes('sprint')) return 'badge-sprint';
    if (d.includes('gravel')) return 'badge-gravel';
    if (d.includes('mountain') || d.includes('climb')) return 'badge-mountain';
    if (d.includes('hill') || d.includes('punch')) return 'badge-hills';
    return 'badge-flat';
  }

  getRaceTypeIcon(desc: string): string {
    const d = (desc || '').toLowerCase();
    if (d.includes('cobble')) return 'fa-chess-board';
    if (d.includes('sprint')) return 'fa-bolt';
    if (d.includes('gravel')) return 'fa-road';
    if (d.includes('mountain')) return 'fa-mountain';
    if (d.includes('hill') || d.includes('punch')) return 'fa-chart-line';
    return 'fa-bicycle';
  }

  isMonument(race: ScoritoRace): boolean {
    const short = (race.TranslatedNameShort || '').toUpperCase();
    return ['MSR', 'TOF', 'RVV', 'PR', 'LBL'].includes(short);
  }
}

