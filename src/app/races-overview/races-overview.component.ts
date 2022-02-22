import {Component, OnInit} from '@angular/core';
import {riders} from '../riders';
import {races} from '../races';
import {teams} from '../teams';
import {QualityType, RiderType, ScoritoQuality, ScoritoRace, ScoritoTeam} from "../scorito-types";
import {Rider, Team} from "../types";

@Component({
	selector: 'app-races-overview',
	templateUrl: './races-overview.component.html',
	styleUrls: ['./races-overview.component.css']
})
export class RacesOverviewComponent implements OnInit {

	displayedColumns: string[] = ["Rider.Name"].concat(races.map(v => v.EventId + ""));
	rider: any;
	riders: Rider [] = riders;
	races: ScoritoRace[] = races.sort((a , b) => a.StartDate > b.StartDate ? 1 : -1 );
	// teams: Team[] = teams.filter(v => !["BCS", "PBS", "MCT", "CJR", "DHA", "DKO", "BCF"].includes(v.Abbreviation));
	teams: ScoritoTeam[] = teams.filter(v => ["QSA", "TJV", "LTS", "EFE", "MOV", "AQT", "SVB", "IGD", "COF",
		"UAD", "TFS", "GFC", "ACT", "TEN", "DSM", "BOH", "IWG", "BEX", "ARX", "TBV", "IPT", "AFC"].includes(v.Abbreviation))
		.sort((a, b) => a.Name > b.Name ? 1 : -1);
	riderTypes: RiderType[] = ["Other", "GC" , "Climber" , "TT" , "Sprinter" , "Attacker" , 	"Support" , "Cobbles" , "Hills"];
	prices: number[] = [500000, 750000, 1000000, 1500000, 2000000, 2500000, 3000000, 3500000, 4000000, 4500000, 5000000, 6000000 ];
	selectedRiders: Rider[] = [];
	teamFilter: any = null;
	riderFilter: any = null;
	priceFilter: any = null;

	constructor() {
	}

	ngOnInit(): void {
		// localStorage.clear();
		let selectedRiders = localStorage.getItem("selectedRiders");
		this.selectedRiders = !!selectedRiders ? JSON.parse(selectedRiders) : [];
		console.log(selectedRiders);
		this.orderBySelectedRiders();
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

	isRacing(races:{[index: string] : number}, eventId: number) {
		return !!races[eventId] && races[eventId] === 1;
	}

	getRacingIcon(races:{[index: string] : number}, eventId: number) {
		let race = races[eventId];
		if(!race) {
			return ""
		}
		else if (race === 1){
			return "fa-check-circle text-success"
		}
		return "fa-question-circle text-muted";
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
		return rider.qualities[type] ?  rider.qualities[type] : 0;
	}



	selectRider(rider: Rider) {
		let indexOfRider = this.selectedRiders.map(v => v.id).indexOf(rider.id);
		if (indexOfRider > -1) {
			this.selectedRiders.splice(indexOfRider, 1);
		} else {
			this.selectedRiders.push(rider);
		}
		localStorage.setItem("selectedRiders", JSON.stringify(this.selectedRiders));
	}

	isSelectedRider(RiderId: number) {
		return this.selectedRiders.map(v => v.id).indexOf(RiderId) > -1;
	}

	remainingBudget() {
		return (!this.selectedRiders || this.selectedRiders.length === 0) ? 46000000 : 46000000 - this.selectedRiders.map(v => v.price).reduce((a, b) => a + b);
	}


	getCobles(qualities: ScoritoQuality[]) {
		return qualities.filter(v => v.Type === 6).map(v => v.Value);

	}

	onTeamClear($event: MouseEvent) {
		this.teamFilter = null;
		this.riders = riders;
	}

	onQualityClear($event: MouseEvent) {
		this.riderFilter = null;
		this.riders = riders;
	}

	onPriceClear($event: MouseEvent) {
		this.priceFilter = null;
		this.riders = riders;
	}

	filterByTeam($event: ScoritoTeam) {
		this.priceFilter = null;
		this.riderFilter = null;
		this.riders = riders.filter(v => v.team.id === $event.Id);
	}
	filterByRiderType($event: any) {
		this.teamFilter = null;
		this.priceFilter = null;
		console.log($event);
		this.riders = riders.filter(v => v.type === $event);
	}

	filterByPrice($event: any) {
		this.teamFilter = null;
		this.riderFilter = null;
		this.riders = riders.filter(v => v.price === $event);
	}

	getNrOfRaces(races: { [p: string]: number }) {
		return Object.values(races).filter(v => v === 1).length;
		// return Object.keys(races).length;
	}

	iconForRaceType(type: string) {
		switch (type) {
			case "Cobbles specialists": return "fa-chess-board";
			case "Sprinters": return "fa-bolt";
			case "Hill specialists": return "fa-caret-up";
		}
		return "";
	}
}
