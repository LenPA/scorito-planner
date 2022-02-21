export interface ScoritoRace {
	CompetitionId: number;
	EventId: number;
	Name: string;
	QualificationEventId: number;
	StartDate: string;
	shortName?: string;
}

export interface ScoritoRider {
	FirstName: string;
	LastName: string;
	MarketRiderId: number;
	NameShort: string;
	Price: number;
	Qualities: ScoritoQuality[],
	RiderId: number;
	TeamId: number;
	Type: number;
	Races: number[];
}

export interface ScoritoQuality {
	Type: number;      // 3 = sprint, 6 = cobbles
	Value: number;
}

export type QualityType = 	"GC" | "Climb" | "Time trial" | "Sprint" | "Punch" | "Hill" | "Cobbles";
// export type QualityType =	 0 |	  1		 |       2			| 		3 	 |	 	4 	 | 		5 	|		 6;

export type RiderType =		 "Other"| "GC" | "Climber" | "TT" | "Sprinter" | "Attacker" | 	"Support" | "Cobbles" | "Hills"
// export type RiderType =	 0 		|	  1		 | 	 2		| 		3 	 |	 	4 	 | 		5 	|		 6  |			7 |   8 ;



export interface ScoritoTeam {
	Abbreviation: string,
	Id: number,
	ImageUrl: string,
	Name: string,
	Type: number
}
