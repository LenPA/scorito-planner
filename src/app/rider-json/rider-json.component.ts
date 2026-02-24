import { Component, OnInit } from '@angular/core';
import { races } from '../races';
import { ridersRaw } from '../riders-2023';
import { teams } from '../teams';
import { ScoritoQuality, QualityType, ScoritoRace, ScoritoRider, ScoritoTeam } from "../scorito-types";
import { ScoritoQueryGateway } from "../scorito-query-gateway";
import { FirestoreService } from "../firestore.service";
import { firstValueFrom } from 'rxjs';

@Component({
	selector: 'app-rider-json',
	templateUrl: './rider-json.component.html',
	styleUrls: ['./rider-json.component.css'],
	standalone: false
})
export class RiderJsonComponent implements OnInit {

	displayedColumns: string[] = ["Rider.Name"].concat(races.map(v => v.EventId + ""));
	rider: any;
	riders: ScoritoRider[] = ridersRaw;
	output: any = [];
	lastSyncAt: Date | null = null;
	isSyncing: boolean = false;
	syncProgress: number = 0;
	totalRidersToSync: number = 0;
	races: ScoritoRace[] = races;
	teams: ScoritoTeam[] = teams;
	qualities: QualityType[] = ["GC", "Climb", "Time trial", "Sprint", "Punch", "Hill", "Cobbles"];
	riderTypes: string[] = ["Other", "GC", "Climber", "TT", "Sprinter", "Attacker", "Support", "Cobbles", "Hills"];

	constructor(private httpClient: ScoritoQueryGateway, private firestoreService: FirestoreService) {
	}

	async ngOnInit(): Promise<void> {
		this.firestoreService.getLastSyncAt().subscribe(lastSyncAt => {
			this.lastSyncAt = lastSyncAt;
		});
	}

	private async mapRider(rider: ScoritoRider) {
		// console.log(rider);
		let mappedRider: any = {};
		// mappedRider[]
		mappedRider.firstName = rider.FirstName;
		mappedRider.lastName = rider.LastName;
		mappedRider.shortName = rider.NameShort;
		mappedRider.price = rider.Price;
		mappedRider.id = rider.RiderId;
		mappedRider.type = this.riderTypes[rider.Type];

		const eventData = await this.getRacesAndQualities(rider.RiderId + "");

		// Fallback to rider.TeamId from the market payload if the event payload teamId is missing
		const teamId = eventData.teamId !== null ? eventData.teamId : rider.TeamId;
		mappedRider.team = this.mapTeam(this.teams.filter(t => t.Id === teamId)[0]);

		mappedRider.races = eventData.races;
		mappedRider.qualities = this.mapQualities(eventData.qualities);

		mappedRider = await this.addRiderProfile(mappedRider);
		console.log(mappedRider);
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

	async getRacesAndQualities(riderId: string) {
		let races: { [index: number]: string } = {};
		let qualities: ScoritoQuality[] = [];
		let teamId: number | null = null;
		try {
			const result: any = await firstValueFrom(this.httpClient.getEventsForRider(riderId));
			if (result && result["Content"]) {
				let resultElement: any[] = result["Content"];
				resultElement.forEach(v => races[v["EventId"]] = v["Status"]);

				// Extract qualities and teamId from the first event object (they are identical)
				if (resultElement.length > 0) {
					if (resultElement[0]["Qualities"]) qualities = resultElement[0]["Qualities"];
					if (resultElement[0]["TeamId"]) teamId = resultElement[0]["TeamId"];
				}
			}
		} catch (error) {
			console.error(`Error fetching events for rider ${riderId}`, error);
		}
		return { races, qualities, teamId };
	}

	async addRiderProfile(mappedRider: any) {
		try {
			const result: any = await firstValueFrom(this.httpClient.getRiderProfile(mappedRider.id));
			if (result && result["Content"]) {
				let riderResult = result["Content"];
				mappedRider.age = riderResult["Age"];
				mappedRider.description = riderResult["Description"];
				mappedRider.nationality = riderResult["Nationality"];
				mappedRider.flagUrl = riderResult["NationalityFlagUrl"];
			}
		} catch (error) {
			console.error(`Error fetching profile for rider ${mappedRider.id}`, error);
		}
		return mappedRider;
	}

	filterRiders(): void {
		// to combine ridersRaw and races
		// this.riders = this.riders.filter(v => v.RiderId === 6357);
		this.riders = this.riders.filter(v => v.RiderId === 1225);
	}

	private mapQualities(Qualities: ScoritoQuality[] | undefined) {
		let mappedQualities: { [index: string]: number } = {};
		if (!Qualities) return mappedQualities;
		Qualities.forEach(value => mappedQualities[this.qualities[value.Type]] = value.Value);
		return mappedQualities;
	}

	print(output: any) {
		JSON.stringify(this.output, null, 4);
	}

	formatJson(output: any) {
		return JSON.stringify(output, null, 2);
	}

	async saveToDatabase() {
		if (!this.output || this.output.length === 0) {
			console.warn("No riders to save");
			return;
		}
		try {
			await this.firestoreService.saveRidersBatch(this.output);
			console.log("Riders saved to database!");
			alert("Riders saved to database!");
		} catch (err) {
			console.error("Error saving riders", err);
			alert("Error saving: " + err);
		}
	}

	syncFromScorito() {
		if (this.isSyncing) return;
		this.isSyncing = true;
		this.syncProgress = 0;
		this.httpClient.getAllRiders().subscribe(
			async (result) => {
				const rawRiders: ScoritoRider[] = result && result["Content"] ? result["Content"] : [];
				this.totalRidersToSync = rawRiders.length;
				if (!rawRiders || rawRiders.length === 0) {
					console.warn("No riders returned from Scorito");
					this.isSyncing = false;
					return;
				}
				const mapped = [];
				for (const rider of rawRiders) {
					mapped.push(await this.mapRider(rider));
					this.syncProgress++;
				}
				this.output = mapped;
				try {
					await this.firestoreService.saveRidersBatch(this.output);
					this.lastSyncAt = new Date();
					await this.firestoreService.saveLastSyncAt(this.lastSyncAt);
					console.log("Riders synced to database!");
					alert("Riders synced to database!");
				} catch (err) {
					console.error("Error syncing riders", err);
					alert("Error syncing: " + err);
				} finally {
					this.isSyncing = false;
				}
			},
			(error) => {
				console.error("Error fetching riders from Scorito", error);
				alert("Error fetching riders: " + error);
				this.isSyncing = false;
			}
		);
	}
}
