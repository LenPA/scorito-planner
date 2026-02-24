import { Component, OnInit } from '@angular/core';
import { riders } from '../r';
import { races } from '../races';
import { teams } from '../teams';
import { QualityType, RiderType, ScoritoQuality, ScoritoRace, ScoritoTeam } from "../scorito-types";
import { Rider, Team } from "../types";
import { SelectionService } from "../selection.service";
import { FirestoreService } from "../firestore.service";

@Component({
	selector: 'app-races-overview',
	templateUrl: './races-overview.component.html',
	styleUrls: ['./races-overview.component.css'],
	standalone: false
})
export class RacesOverviewComponent implements OnInit {
	private readonly currencyFormatter = new Intl.NumberFormat('nl-NL', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	});

	displayedColumns: string[] = ["Rider.Name"].concat(races.map(v => v.EventId + ""));
	rider: any;
	allRiders: Rider[] = riders;
	riders: Rider[] = riders;
	races: ScoritoRace[] = races.sort((a, b) => a.StartDate > b.StartDate ? 1 : -1);
	// teams: Team[] = teams.filter(v => !["BCS", "PBS", "MCT", "CJR", "DHA", "DKO", "BCF"].includes(v.Abbreviation));
	teams: ScoritoTeam[] = teams.filter(v => ["QSA", "TJV", "LTS", "EFE", "MOV", "AQT", "SVB", "IGD", "COF",
		"UAD", "TFS", "GFC", "ACT", "TEN", "DSM", "BOH", "IWG", "BEX", "ARX", "TBV", "IPT", "AFC"].includes(v.Abbreviation))
		.sort((a, b) => a.Name > b.Name ? 1 : -1);
	riderTypes: RiderType[] = ["Other", "GC", "Climber", "TT", "Sprinter", "Attacker", "Support", "Cobbles", "Hills"];
	prices: number[] = [500000, 750000, 1000000, 1500000, 2000000, 2500000, 3000000, 3500000, 4000000, 4500000, 5000000, 6000000];
	selectedRiders: Rider[] = [];
	raceCaptains: { [eventId: number]: { c1?: number, c2?: number, c3?: number } } = {};
	teamFilter: any = null;
	riderFilter: any = null;
	priceFilter: any = null;

	showTeamSummary: boolean = false;

	selection: string = "default";
	newSelection: string = "";
	selections: string[] = Object.keys(localStorage);

	constructor(private selectionService: SelectionService, private firestoreService: FirestoreService) {
	}

	ngOnInit(): void {
		this.selectionService.selectedRiders$.subscribe(riders => {
			this.selectedRiders = riders;
			this.orderBySelectedRiders();
		});

		this.selectionService.raceCaptains$.subscribe(captains => {
			this.raceCaptains = captains || {};
		});

		// Load riders from Firestore
		let seededFirestore = false;
		this.firestoreService.getAllRiders().subscribe(
			(dbRiders) => {
				if (!dbRiders || dbRiders.length === 0) {
					if (!seededFirestore) {
						seededFirestore = true;
						this.firestoreService.saveRidersBatch(this.riders).catch(error => {
							console.error("Error seeding riders to DB", error);
						});
					}
					return;
				}
				if (dbRiders.length > 0) {
					console.log("Loaded riders from DB:", dbRiders.length);
					this.riders = dbRiders;
					this.allRiders = dbRiders;
					// Re-apply sort/filter if needed
					this.orderBySelectedRiders();
				}
			},
			(error) => {
				console.error("Error loading from DB", error);
				// Fallback or error handling
			}
		);
	}

	orderBySelectedRiders() {
		this.riders.sort((a, b) => this.compareRidersBySelection(a, b));
	}

	private compareRidersBySelection(a: Rider, b: Rider) {
		{
			let aSelected = this.selectedRiders.map(v => v.id).indexOf(a.id) > -1;
			let bSelected = this.selectedRiders.map(v => v.id).indexOf(b.id) > -1;
			if (!aSelected && bSelected) {
				return 1;
			} else if (aSelected && !bSelected) {
				return -1;
			} else {
				return a.price >= b.price ? -1 : 1;
			}
		}
	}

	getraces(races: any): string[] {
		// return races != undefined ? this.displayedColumns.map(v => (<[]>races).map(v => v + "").indexOf(v) > -1 ? "X" : "") : this.displayedColumns.map(v => "");
		return !!races ? (<[]>races).map(v => v + "") : [];
	}

	isRacing(races: { [index: string]: number } | undefined, eventId: number) {
		return !!races && !!races[eventId] && races[eventId] === 1;
	}

	getRacingIcon(races: { [index: string]: number } | undefined, eventId: number) {
		if (!races) return "fa-question-circle text-muted";
		let race = races[eventId];
		if (!race) {
			return ""
		}
		else if (race === 1) {
			// IS RACING
			return "fa-check-circle text-success"
		} else if (race === 2) {
			// IS NOT RACING
			return "fa-times-circle text-danger"
		}
		return "fa-question-circle text-muted";
	}

	getCaptainLevel(eventId: number, riderId: number): number | undefined {
		if (!this.raceCaptains[eventId]) return undefined;
		if (this.raceCaptains[eventId].c1 === riderId) return 1;
		if (this.raceCaptains[eventId].c2 === riderId) return 2;
		if (this.raceCaptains[eventId].c3 === riderId) return 3;
		return undefined;
	}

	toggleCaptain(eventId: number, rider: Rider) {
		// Only allow toggling if rider actually races this event
		if (!rider.races || rider.races[eventId] !== 1) return;

		// If rider is not in main squad yet, we could auto-add them, or just alert.
		if (!this.isSelectedRider(rider.id)) {
			// Auto add to squad if pressed
			this.selectRider(rider);
		}

		const currentLevel = this.getCaptainLevel(eventId, rider.id);
		let nextLevel: 1 | 2 | 3 | undefined;

		// Cycle: Not Captain -> C1 -> C2 -> C3 -> Not Captain
		if (currentLevel === undefined) nextLevel = 1;
		else if (currentLevel === 1) nextLevel = 2;
		else if (currentLevel === 2) nextLevel = 3;
		else if (currentLevel === 3) nextLevel = undefined;

		if (nextLevel === undefined) {
			// to remove a captain, we just set the exact level they were to undefined
			this.selectionService.setCaptain(eventId, currentLevel as any, undefined);
		} else {
			this.selectionService.setCaptain(eventId, nextLevel, rider.id);
		}
	}

	orderByRace(EventId: number) {
		this.riders.sort((a, b) => this.compareRidersByEvent(a, b, EventId));
	}

	private compareRidersByEvent(a: Rider, b: Rider, EventId: number) {
		{
			let aRides = this.isRacing(a.races, EventId);
			let bRides = this.isRacing(b.races, EventId);

			// if a rides sort a before b
			if (aRides && !bRides) {
				return -1;
			}
			// if b rides sort a after b
			else if (!aRides && bRides) {
				return 1;
				// if both ride sort on price
			} else {
				let aSelected = this.isSelectedRider(a.id);
				let bSelected = this.isSelectedRider(b.id);
				if (aSelected && !bSelected) {
					return -1;
				} else {
					if (bSelected && !aSelected) {
						return 1;
					} else {
						return a.price >= b.price ? -1 : 1;
					}
				}
			}
			// if b
			return 0;
		}
	}

	orderByValue() {
		this.riders.sort((a, b) => a.price > b.price ? -1 : 1);
	}

	orderByRiderName() {
		this.riders.sort((a, b) => a.lastName.toUpperCase() > b.lastName.toUpperCase() ? 1 : -1);
	}

	orderByNrOfRaces() {
		this.riders.sort((a, b) => this.getNrOfRaces(a.races) > this.getNrOfRaces(b.races) ? -1 : 1);
	}

	orderByTeam() {
		this.riders.sort((a, b) => a.team.id > b.team.id ? 1 : -1);
	}


	orderByQuality(quality: QualityType) {
		this.riders.sort((a, b) => this.getQuality(a, quality) > this.getQuality(b, quality) ? -1 : 1);
	}

	getQuality(rider: Rider, type: QualityType) {
		return rider.qualities && rider.qualities[type] ? rider.qualities[type] : 0;
	}



	selectRider(rider: Rider) {
		if (this.isSelectedRider(rider.id)) {
			this.selectionService.removeRider(rider);
		} else {
			this.selectionService.addRider(rider);
		}
	}

	isSelectedRider(RiderId: number) {
		return this.selectionService.isSelected(RiderId);
	}

	remainingBudget() {
		return this.selectionService.remainingBudget;
	}

	formatCurrency(amount: number) {
		return this.currencyFormatter.format(amount);
	}


	getCobles(qualities: ScoritoQuality[]) {
		return qualities.filter(v => v.Type === 6).map(v => v.Value);

	}

	onTeamClear($event: MouseEvent) {
		this.teamFilter = null;
		this.riders = this.allRiders;
	}

	onQualityClear($event: MouseEvent) {
		this.riderFilter = null;
		this.riders = this.allRiders;
	}

	onPriceClear($event: MouseEvent) {
		this.priceFilter = null;
		this.riders = this.allRiders;
	}

	filterByTeam($event: ScoritoTeam) {
		this.priceFilter = null;
		this.riderFilter = null;
		this.riders = this.allRiders.filter(v => v.team && v.team.id === $event.Id);
	}

	filterByRiderType($event: any) {
		this.teamFilter = null;
		this.priceFilter = null;
		console.log($event);
		this.riders = this.allRiders.filter(v => v.type === $event);
	}

	filterByPrice($event: any) {
		this.teamFilter = null;
		this.riderFilter = null;
		this.riders = this.allRiders.filter(v => v.price === $event);
	}

	getNrOfRaces(races: { [p: string]: number } | undefined) {
		if (!races) return 0;
		return Object.values(races).filter(v => v === 1).length;
	}

	iconForRaceType(type: string) {
		switch (type) {
			case "Cobbles": return "fa-chess-board";
			case "Sprinters": return "fa-bolt";
			case "Hills": return "fa-caret-up";
		}
		return "";
	}

	getNrOf(selectedRiders: Rider[], type: string) {
		return selectedRiders.filter(v => v.type === type).length;
	}

	loadSelection($event: string) {
		this.selectionService.loadFromStorage($event);
	}

	save(selection: string) {
		this.selectionService.saveToStorage(selection, this.selectedRiders);
		this.newSelection = "";
		this.selections = Object.keys(localStorage);
		this.selection = selection;
	}

	delete(selection: string) {
		localStorage.removeItem(selection);
		this.selectionService.loadFromStorage("default");
		this.selection = "default";
		this.selections = Object.keys(localStorage);
	}

	toggleTeamSummary() {
		this.showTeamSummary = !this.showTeamSummary;
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
