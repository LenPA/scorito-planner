import {Component, OnInit} from '@angular/core';
import {races} from '../races';
import {ridersRaw} from '../riders-2023';
import {teams} from '../teams';
import {ScoritoQuality, QualityType, ScoritoRace, ScoritoRider, ScoritoTeam} from "../scorito-types";
import {ScoritoQueryGateway} from "../scorito-query-gateway";

@Component({
	selector: 'app-rider-json',
	templateUrl: './rider-json.component.html',
	styleUrls: ['./rider-json.component.css']
})
export class RiderJsonComponent implements OnInit {

	displayedColumns: string[] = ["Rider.Name"].concat(races.map(v => v.EventId + ""));
	rider: any;
	riders: ScoritoRider [] = ridersRaw;
	output: any = [];
	races: ScoritoRace[] = races;
	teams: ScoritoTeam[] = teams;
	qualities: QualityType[] = ["GC", "Climb", "Time trial", "Sprint", "Punch", "Hill", "Cobbles"];
	riderTypes: string[] = ["Other", "GC", "Climber", "TT", "Sprinter", "Attacker", "Support", "Cobbles", "Hills"];

	constructor(private httpClient: ScoritoQueryGateway) {
	}

	ngOnInit(): void {
		//this.filterRiders();
		this.output = this.riders.map(rider => this.mapRider(rider));
    // this.httpClient.getAllRiders().subscribe(result => this.output = result["Content"]);
	}

	private mapRider(rider: ScoritoRider) {
		// console.log(rider);
		let mappedRider: any = {};
		// mappedRider[]
		mappedRider.firstName = rider.FirstName;
		mappedRider.lastName = rider.LastName;
		mappedRider.shortName = rider.NameShort;
		mappedRider.price = rider.Price;
		mappedRider.id = rider.RiderId;
		mappedRider.type = this.riderTypes[rider.Type];
		mappedRider.team = this.mapTeam(this.teams.filter(t => t.Id === rider.TeamId)[0]);
		mappedRider.qualities = this.mapQualities(rider.Qualities);
		mappedRider.races = this.getRaces(rider.RiderId + "");
		mappedRider = this.addRiderProfile(mappedRider);
		// console.log(mappedRider);
		return mappedRider;
	}

	private mapTeam(team: ScoritoTeam) {
		let mappedTeam: any = {};
		if (!team) {
			return mappedTeam;
		}
		mappedTeam["id"] = team.Id;
		mappedTeam["shortName"] = team.Abbreviation;
		mappedTeam["name"] = team.Name;
		mappedTeam["tenueUrl"] = team.ImageUrl;
		return mappedTeam;
	}

	getRaces(riderId: string) {
		let races: { [index: number]: string } = {};
		this.httpClient.getEventsForRider(riderId)
			.subscribe(result => {
				let resultElement: any[] = result["Content"];
				resultElement.forEach(v => races[v["EventId"]] = v["Status"]);
			});
		return races;
	}

	addRiderProfile(mappedRider: any) {
		this.httpClient.getRiderProfile(mappedRider.id).subscribe(result =>
		{
			let riderResult = result["Content"];
			mappedRider.age = riderResult["Age"];
			mappedRider.description = riderResult["Description"];
			mappedRider.nationality = riderResult["Nationality"];
			mappedRider.flagUrl = riderResult["NationalityFlagUrl"];
		});
		return mappedRider;
	}

	filterRiders(): void {
		// to combine ridersRaw and races
		// this.riders = this.riders.filter(v => v.RiderId === 6357);
		this.riders = this.riders.filter(v => v.RiderId === 1225);
	}

	private mapQualities(Qualities: ScoritoQuality[]) {
		let mappedQualities: { [index: string]: number } = {};			// Qualities.map((value, index) => return {this.qualities[value.Type] : Qualities[index].Type})
		Qualities.forEach(value => mappedQualities[this.qualities[value.Type]] = value.Value);
		return mappedQualities;
	}

	print(output: any) {
		JSON.stringify(this.output, null, 4);
	}
}
