import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
	providedIn: 'root',
})
export class ScoritoQueryGateway {
	riderEventsUrl = "/cycling/v2.0/eventrider/227/";
	ridersUrl = "/cyclingteammanager/v2.0/marketrider/227";
	riderProfileUrl = "/cycling/v2.0/rider/details/";
	options = {
		headers: new HttpHeaders({
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin':'*',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Allow-Methods': 'OPTIONS, GET, POST'

		})
	};

  constructor(private client: HttpClient) {
	}

	sendRequest(request: string): Observable<any> {
		return this.client.get(this.riderEventsUrl);
	}

	public getEventsForRider(riderNr: string): Observable<any> {
		return this.client.get(this.riderEventsUrl + riderNr, this.options);
	}

	public getRiderProfile(riderNr: string): Observable<any> {
		return this.client.get(this.riderProfileUrl + riderNr + "/633/nl-NL", this.options);
	}

  public getAllRiders(): Observable<any> {
    return this.client.get(this.ridersUrl, this.options);
  }

}
