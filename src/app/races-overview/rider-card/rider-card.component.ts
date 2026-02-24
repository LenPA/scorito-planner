import {Component, Input, OnInit} from '@angular/core';
import {Rider} from "../../types";

@Component({
    selector: 'app-rider-card',
    templateUrl: './rider-card.component.html',
    styleUrls: ['./rider-card.component.css'],
    standalone: false
})
export class RiderCardComponent implements OnInit {

	// @ts-ignore
	@Input() rider: Rider;

	constructor() {
	}

	ngOnInit(): void {
	}

	qualities: string[] =["Climb" , "Time trial" , "Sprint" , "Punch" , "Hill" , "Cobbles"].reverse(); //"GC" ,

	numSequence(n: number): Array<number> {
		return Array(n);
	}

	getLink(rider: Rider) {
		return "https://www.wielerflits.nl/?s=" + rider.firstName + "+" + rider.lastName.replace(" ", "+");
	}



}
