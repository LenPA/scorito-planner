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
	displayedColumns: string[] = races.map(v => v.Name);
	rider: any;
	riders: { [index: string]: Rider } = riders;

	constructor(private httpClient: ScoritoQueryGateway) {
	}

	ngOnInit(): void {

	}

	fetchRiders(): void {
		// to combine riders and races
		// this.riders = this.riders.filter(v => v.RiderId === 1225);
		// this.riders.forEach(rider => {
		// 	let riderId: string = rider.RiderId + "";
		// 	this.riderMap[riderId] = rider;
			// this.httpClient.getEventsForRider(riderId)
			// 	.subscribe(result => {
			// 		console.log(result);
			// 		rider.Races = result["Content"].map((v: any) => v["EventId"]);
			// 		this.riderMap[riderId] = rider;
			// 	});
		// });
	}

}
