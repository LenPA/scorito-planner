import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from '../firestore.service';
import { Rider } from '../types';
import { GrandTourId, GrandTourInfo, Stage, StageLineup, StageType } from './grand-tour-types';
import { GrandTourService } from './grand-tour.service';
import { GRAND_TOURS_DATA, SCORITO_POINTS } from './grand-tour-data';

@Component({
  selector: 'app-grand-tour',
  templateUrl: './grand-tour.component.html',
  styleUrls: ['./grand-tour.component.css'],
  standalone: false
})
export class GrandTourComponent implements OnInit {
  activeTourId: GrandTourId = 'tour';
  activeTourInfo: GrandTourInfo = GRAND_TOURS_DATA['tour'];

  activeTab: 'stages' | 'classifications' | 'matrix' | 'squad' = 'stages';
  selectedStageNumber: number = 1;

  allPelotonRiders: Rider[] = [];
  filteredPelotonRiders: Rider[] = [];
  squad: Rider[] = [];

  stageLineups: { [stageNum: number]: StageLineup } = {};

  // Search & filter for peloton rider selection
  searchQuery: string = '';
  typeFilter: string = 'all';
  sortBy: 'price_desc' | 'price_asc' | 'name' = 'price_desc';

  readonly scoritoPoints = SCORITO_POINTS;
  readonly tourOptions: { id: GrandTourId, name: string, flag: string, color: string }[] = [
    { id: 'tour', name: 'Tour de France', flag: '🇫🇷', color: '#eab308' },
    { id: 'giro', name: 'Giro d\'Italia', flag: '🇮🇹', color: '#db2777' },
    { id: 'vuelta', name: 'Vuelta a España', flag: '🇪🇸', color: '#dc2626' }
  ];

  constructor(
    public gtService: GrandTourService,
    private firestoreService: FirestoreService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Subscribe to route parameter for tour switching (/grand-tour/:tourId)
    this.route.params.subscribe(params => {
      const tourParam = params['tourId'] as GrandTourId;
      if (tourParam && ['giro', 'tour', 'vuelta'].includes(tourParam)) {
        this.selectTour(tourParam);
      } else {
        this.selectTour('tour');
      }
    });

    // 2. Subscribe to squad changes
    this.gtService.squad$.subscribe(squad => {
      this.squad = squad;
    });

    // 3. Subscribe to stage lineup changes
    this.gtService.stageLineups$.subscribe(lineups => {
      this.stageLineups = lineups;
    });

    // 4. Fetch all available riders from Firestore
    this.firestoreService.getAllRiders().subscribe(riders => {
      if (riders && riders.length > 0) {
        this.allPelotonRiders = riders;
        this.applyRiderFilters();
      }
    });
  }

  selectTour(tourId: GrandTourId) {
    this.activeTourId = tourId;
    this.activeTourInfo = GRAND_TOURS_DATA[tourId];
    this.gtService.switchTour(tourId);
    this.selectedStageNumber = 1;
  }

  changeTourTab(tourId: GrandTourId) {
    this.router.navigate(['/grand-tour', tourId]);
  }

  get activeStage(): Stage {
    return this.activeTourInfo.stages.find(s => s.stageNumber === this.selectedStageNumber)
      || this.activeTourInfo.stages[0];
  }

  get currentStageLineup(): StageLineup {
    return this.stageLineups[this.selectedStageNumber] || {
      stageNumber: this.selectedStageNumber,
      riderIds: [],
      captainId: null
    };
  }

  get currentStageRiders(): Rider[] {
    const ids = this.currentStageLineup.riderIds;
    return this.squad.filter(r => ids.includes(r.id));
  }

  get isCurrentStageFull(): boolean {
    return this.currentStageLineup.riderIds.length >= this.gtService.MAX_STAGE_RIDERS;
  }

  isRiderInCurrentStage(riderId: number): boolean {
    return this.currentStageLineup.riderIds.includes(riderId);
  }

  isRiderStageCaptain(riderId: number): boolean {
    return this.currentStageLineup.captainId === riderId;
  }

  toggleRiderInActiveStage(riderId: number) {
    this.gtService.toggleRiderInStage(this.selectedStageNumber, riderId);
  }

  setCaptain(riderId: number) {
    this.gtService.setStageCaptain(this.selectedStageNumber, riderId);
  }

  goToNextStage() {
    if (this.selectedStageNumber < 21) {
      this.selectedStageNumber++;
    }
  }

  goToPrevStage() {
    if (this.selectedStageNumber > 1) {
      this.selectedStageNumber--;
    }
  }

  // --- SQUAD FILTERING ---
  applyRiderFilters() {
    let result = [...this.allPelotonRiders];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.firstName && r.firstName.toLowerCase().includes(q)) ||
        (r.lastName && r.lastName.toLowerCase().includes(q)) ||
        (r.shortName && r.shortName.toLowerCase().includes(q)) ||
        (r.team && r.team.name && r.team.name.toLowerCase().includes(q))
      );
    }

    if (this.typeFilter !== 'all') {
      result = result.filter(r => r.type && r.type.toLowerCase() === this.typeFilter.toLowerCase());
    }

    if (this.sortBy === 'price_desc') {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (this.sortBy === 'price_asc') {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (this.sortBy === 'name') {
      result.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
    }

    this.filteredPelotonRiders = result;
  }

  isRiderInSquad(riderId: number): boolean {
    return this.squad.some(r => r.id === riderId);
  }

  toggleSquadRider(rider: Rider) {
    if (this.isRiderInSquad(rider.id)) {
      this.gtService.removeRiderFromSquad(rider.id);
    } else {
      this.gtService.addRiderToSquad(rider);
    }
  }

  // --- CLASSIFICATION PREDICTIONS ---
  getRiderById(riderId: number | null): Rider | undefined {
    if (!riderId) return undefined;
    return this.allPelotonRiders.find(r => r.id === riderId);
  }

  onClassificationChange(category: 'general' | 'points' | 'mountain' | 'youth', position: number, event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    const riderId = val ? Number(val) : null;
    this.gtService.setClassificationRider(category, position, riderId);
  }

  getStageBadgeClass(type: StageType): string {
    switch (type) {
      case 'mountain': return 'stage-badge-mountain';
      case 'hilly': return 'stage-badge-hilly';
      case 'time_trial': return 'stage-badge-tt';
      case 'gravel': return 'stage-badge-gravel';
      default: return 'stage-badge-flat';
    }
  }

  getStageTypeName(type: StageType): string {
    switch (type) {
      case 'mountain': return 'Bergrit';
      case 'hilly': return 'Heuvels';
      case 'time_trial': return 'Tijdrit';
      case 'gravel': return 'Gravel / Kasseien';
      default: return 'Vlakke rit';
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price || 0);
  }
}
