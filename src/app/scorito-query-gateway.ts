import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../environments/environment";

@Injectable({
	providedIn: 'root',
})
export class ScoritoQueryGateway {
	private readonly baseUrl = environment.cyclingBaseUrl;
	riderEventsUrl = `${this.baseUrl}/cycling/v2.0/eventrider/302/`;
	ridersUrl = `${this.baseUrl}/cyclingteammanager/v2.0/marketrider/302`;
	riderProfileUrl = `${this.baseUrl}/cycling/v2.0/rider/details/`;
	options = {
		headers: new HttpHeaders({
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Allow-Methods': 'OPTIONS, GET, POST'

		})
	};

  // https://cycling.scorito.com/cycling/v2.0/rider/details/6504/781/nl-NL


    constructor(private client: HttpClient) {
	}

	sendRequest(request: string): Observable<any> {
		return this.client.get(this.riderEventsUrl);
	}

	public getEventsForRider(riderNr: string): Observable<any> {
		return this.client.get(this.riderEventsUrl + riderNr, this.options);
	}

	public getRiderProfile(riderNr: string): Observable<any> {
		return this.client.get(this.riderProfileUrl + riderNr + "/781/nl-NL", this.options);
	}

	public getAllRiders(): Observable<any> {
		return this.client.get(this.ridersUrl, this.options);
	}

}
