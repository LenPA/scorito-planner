import {QualityType} from "./scorito-types";

export interface Rider {
	id: number;
	age?: number;
	description?: string;
	nationality?: string;
	flagUrl?: string;
	firstName: string;
	lastName: string;
	shortName: string;
	price: number;
	type?: string;
	team: any;
	races: {[index: string] : number};
	qualities: {[index: string] : number};
}

export interface Team {
	id: number;
	shortName: string;
	name: string;
	tenueUrl: string;
}
