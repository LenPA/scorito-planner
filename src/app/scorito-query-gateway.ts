import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
	providedIn: 'root',
})
export class ScoritoQueryGateway {
	baseUrl = "/cycling/v2.0/eventrider/200/";

  constructor(private client: HttpClient) {
	}

	sendRequest(request: string): Observable<any> {
		return this.client.get(this.baseUrl);
	}

	public getEventsForRider(riderNr: string): Observable<any> {
		const options = {
			headers: new HttpHeaders({
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin':'*',
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Allow-Methods': 'OPTIONS, GET, POST'

			})
		};
		return this.client.get(this.baseUrl + riderNr, options);
	}

}
