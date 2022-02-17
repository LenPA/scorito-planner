import {Component, OnInit} from '@angular/core';
import {riders} from '../riders';
import {races} from '../races';
import {Race, Rider} from "../types";
import {ScoritoQueryGateway} from "../scorito-query-gateway";

@Component({
	selector: 'app-races-overview',
	templateUrl: './races-overview.component.html',
	styleUrls: ['./races-overview.component.css']
})
export class RacesOverviewComponent implements OnInit {

	races: Race[] = races;
	displayedColumns: string[] = ["Rider.Name"].concat(races.map(v => v.EventId + ""));
	rider: any;
	riders: Rider [] = riders;
	selectedRiders: Rider[] = [];

	constructor(private httpClient: ScoritoQueryGateway) {
	}

	ngOnInit(): void {
		let selectedRiders = localStorage.getItem("selectedRiders");
		this.selectedRiders = !!selectedRiders ? JSON.parse(selectedRiders) : [];
		console.log(this.selectedRiders);
		this.orderBySelectedRiders();
	}

	orderBySelectedRiders() {
		this.riders.sort((a, b) => this.compareRidersBySelection(a, b) );
	}

	private compareRidersBySelection(a: Rider, b: Rider) {
		{
			let aSelected = this.selectedRiders.map(v => v.RiderId).indexOf(a.RiderId) > -1;
			let bSelected = this.selectedRiders.map(v => v.RiderId).indexOf(b.RiderId) > -1;
			if(!aSelected && bSelected) {
				return 1;
			}
			else if (aSelected && !bSelected) {
				return -1;
			} else {
				return a.Price >= b.Price ? -1 : 1;
			}
			return 0;
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
		return !!Races ? (<[]>Races).map(v => v + ""): [];
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
			if(!aRides && bRides) {
				return 1;
			}
			else if (aRides && !bRides) {
				return -1;
			} else {
				return a.Price >= b.Price ? -1 : 1;
			}
			return 0;
		}
	}

	orderByRiderName() {
		this.riders.sort();
	}

	selectRider(rider: Rider) {
		let indexOfRider = this.selectedRiders.map(v => v.RiderId).indexOf(rider.RiderId);
		console.log(indexOfRider);
		console.log(rider);
		console.log(this.selectedRiders);
		if (indexOfRider > -1) {
			console.log("rider present");
			this.selectedRiders.splice(indexOfRider, 1);
		} else {
			this.selectedRiders.push(rider);
		}
		localStorage.setItem("selectedRiders", JSON.stringify(this.selectedRiders));

	}

	isSelectedRider(RiderId: number) {
		return this.selectedRiders.map(v => v.RiderId).indexOf(RiderId) > -1;
	}
}
