export interface Race {
	CompetitionId: number;
	EventId: number;
	Name: string;
	QualificationEventId: number;
	StartDate: string;
}

export interface Rider {
	FirstName: string;
	LastName: string;
	MarketRiderId: number;
	NameShort: string;
	Price: number;
	Qualities: Quality[],
	RiderId: number;
	TeamId: number;
	Type: number;
	Races: number[];
}

export interface Quality {
	Type: number;
	Value: number;
}
