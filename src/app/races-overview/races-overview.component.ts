import {Component, OnInit} from '@angular/core';
import {riders} from '../riders';
import {races} from '../races';
import {teams} from '../teams';
import {Quality, QualityType, Race, Rider, Team} from "../types";
import {ScoritoQueryGateway} from "../scorito-query-gateway";

@Component({
	selector: 'app-races-overview',
	templateUrl: './races-overview.component.html',
	styleUrls: ['./races-overview.component.css']
})
export class RacesOverviewComponent implements OnInit {

	displayedColumns: string[] = ["Rider.Name"].concat(races.map(v => v.EventId + ""));
	rider: any;
	riders: Rider [] = riders;
	races: Race[] = races;
	// teams: Team[] = teams.filter(v => !["BCS", "PBS", "MCT", "CJR", "DHA", "DKO", "BCF"].includes(v.Abbreviation));
	teams: Team[] = teams.filter(v => ["QSA", "TJV", "LTS", "EFE", "MOV", "AQT", "SVB", "IGD", "COF",
		"UAD", "TFS", "GFC", "ACT", "TEN", "DSM", "BOH", "IWG", "BEX", "ARX", "TBV", "IPT", "AFC"].includes(v.Abbreviation))
		.sort((a, b) => a.Name > b.Name ? 1 : -1);
	qualities: QualityType[] = [];
	selectedRiders: Rider[] = [];
	teamFilter: any = null;
	qualityFilter: any = null;

	constructor(private httpClient: ScoritoQueryGateway) {
	}

	ngOnInit(): void {
		let selectedRiders = localStorage.getItem("selectedRiders");
		this.selectedRiders = !!selectedRiders ? JSON.parse(selectedRiders) : [];
		this.orderBySelectedRiders();
		this.qualities = ["GC" , "Climb" , "Time trial" , "Sprint" , "Punch" , "Hill" , "Cobbles"];
	}

	orderBySelectedRiders() {
		this.riders.sort((a, b) => this.compareRidersBySelection(a, b));
	}

	private compareRidersBySelection(a: Rider, b: Rider) {
		{
			let aSelected = this.selectedRiders.map(v => v.RiderId).indexOf(a.RiderId) > -1;
			let bSelected = this.selectedRiders.map(v => v.RiderId).indexOf(b.RiderId) > -1;
			if (!aSelected && bSelected) {
				return 1;
			} else if (aSelected && !bSelected) {
				return -1;
			} else {
				return a.Price >= b.Price ? -1 : 1;
			}
		}
	}


	fetchRiders(): void {
		// to combine riders and races
		this.riders = this.riders.filter(v => v.RiderId === 1225);
		this.riders.forEach(rider => {
			let riderId: string = rider.RiderId + "";
			this.httpClient.getEventsForRider(riderId)
				.subscribe(result => {
					rider.Races = result["Content"].map((v: any) => v["EventId"]);
				});
		});
	}

	getRaces(Races: any): string[] {
		// return Races != undefined ? this.displayedColumns.map(v => (<[]>Races).map(v => v + "").indexOf(v) > -1 ? "X" : "") : this.displayedColumns.map(v => "");
		return !!Races ? (<[]>Races).map(v => v + "") : [];
	}

	isRacing(Races: number[], EventId: number) {
		return Races.indexOf(EventId) > -1;
	}

	orderByRace(EventId: number) {
		this.riders.sort((a, b) => this.compareRidersByEvent(a, b, EventId));
	}

	private compareRidersByEvent(a: Rider, b: Rider, EventId: number) {
		{
			let aRides = a.Races.indexOf(EventId) > -1;
			let bRides = b.Races.indexOf(EventId) > -1;

			// if a rides sort a before b
			if (aRides && !bRides) {
				return -1;
			}
			// if b rides sort a after b
			else if (!aRides && bRides) {
				return 1;
				// if both ride sort on price
			} else {
				let aSelected = this.isSelectedRider(a.RiderId);
				let bSelected = this.isSelectedRider(b.RiderId);
				if (aSelected && !bSelected) {
					return -1;
				} else {
					if (bSelected && !aSelected) {
						return 1;
					} else {
						return a.Price >= b.Price ? -1 : 1;
					}
				}
			}
			// if b
			return 0;
		}
	}

	orderByValue() {
		this.riders.sort((a, b) => a.Price > b.Price ? -1 : 1);
	}

	orderByRiderName() {
		this.riders.sort((a, b) => a.LastName.toUpperCase() > b.LastName.toUpperCase() ? 1 : -1);
	}

	orderByNrOfRaces() {
		this.riders.sort((a, b) => a.Races.length > b.Races.length ? -1 : 1);
	}

	orderByTeam() {
		this.riders.sort((a, b) => a.TeamId > b.TeamId ? 1 : -1);
	}


	orderByQuality(quality: number) {
		this.riders.sort((a, b) => this.getQuality(a, quality) > this.getQuality(b, quality) ? -1 : 1);
	}

	getQuality(rider: Rider, type: number) {
		return rider.Qualities.filter(v => v.Type === type).map(v => v.Value);
	}

	selectRider(rider: Rider) {
		let indexOfRider = this.selectedRiders.map(v => v.RiderId).indexOf(rider.RiderId);
		if (indexOfRider > -1) {
			this.selectedRiders.splice(indexOfRider, 1);
		} else {
			this.selectedRiders.push(rider);
		}
		localStorage.setItem("selectedRiders", JSON.stringify(this.selectedRiders));
	}

	isSelectedRider(RiderId: number) {
		return this.selectedRiders.map(v => v.RiderId).indexOf(RiderId) > -1;
	}

	remainingBudget() {
		return 46000000 - this.selectedRiders.map(v => v.Price).reduce((a, b) => a + b);
	}


	getTeam(TeamId: number): Team {
		return this.teams.filter(t => t.Id === TeamId)[0];
	}

	getCobles(Qualities: Quality[]) {
		return Qualities.filter(v => v.Type === 6).map(v => v.Value);

	}

	onTeamClick($event: MouseEvent) {
		this.teamFilter = null;
		this.riders = riders;
	}

	filterByTeam($event: Team) {
		this.qualityFilter = null;
		this.riders = riders.filter(v => v.TeamId === $event.Id);
	}

	filterByQuality($event: any) {
		this.teamFilter = null;
		// this.riders.so
	}

	onQualityClick($event: MouseEvent) {
		this.qualityFilter = null;
		this.riders = riders;
	}
}
