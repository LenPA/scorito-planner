import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Rider } from './types';

@Injectable({
    providedIn: 'root'
})
export class SelectionService {
    private selectedRiderssource = new BehaviorSubject<Rider[]>([]);
    selectedRiders$ = this.selectedRiderssource.asObservable();

    private raceSelectionsSource = new BehaviorSubject<{ [eventId: number]: number[] }>({});
    raceSelections$ = this.raceSelectionsSource.asObservable();

    private readonly BUDGET_LIMIT = 48000000;
    private readonly RIDER_LIMIT = 20;

    constructor() {
        this.loadFromStorage('default');
    }

    get selectedRiders(): Rider[] {
        return this.selectedRiderssource.value;
    }

    addRider(rider: Rider) {
        const current = this.selectedRiders;
        if (current.find(r => r.id === rider.id)) {
            return;
        }
        if (current.length >= this.RIDER_LIMIT) {
            console.warn('Rider limit reached');
            return;
        }
        const updated = [...current, rider];
        this.selectedRiderssource.next(updated);
        this.saveToStorage('default', updated);
    }

    removeRider(rider: Rider) {
        const updated = this.selectedRiders.filter(r => r.id !== rider.id);
        this.selectedRiderssource.next(updated);
        this.saveToStorage('default', updated);

        // Also remove from all race selections
        const currentRaceSelections = this.raceSelections;
        let modified = false;
        Object.keys(currentRaceSelections).forEach(key => {
            const eventId = Number(key);
            if (currentRaceSelections[eventId] && currentRaceSelections[eventId].includes(rider.id)) {
                currentRaceSelections[eventId] = currentRaceSelections[eventId].filter(id => id !== rider.id);
                modified = true;
            }
        });
        if (modified) {
            this.raceSelectionsSource.next(currentRaceSelections);
            this.saveRaceSelectionsToStorage('default_race_selections', currentRaceSelections);
        }
    }

    isSelected(riderId: number): boolean {
        return this.selectedRiders.some(r => r.id === riderId);
    }

    get remainingBudget(): number {
        const spent = this.selectedRiders.reduce((acc, rider) => acc + rider.price, 0);
        return this.BUDGET_LIMIT - spent;
    }

    get riderCount(): number {
        return this.selectedRiders.length;
    }

    get raceSelections(): { [eventId: number]: number[] } {
        return this.raceSelectionsSource.value;
    }

    updateRaceSelection(eventId: number, riderIds: number[]) {
        const current = { ...this.raceSelections };
        current[eventId] = riderIds;
        this.raceSelectionsSource.next(current);
        this.saveRaceSelectionsToStorage('default_race_selections', current);
    }

    autoAssignRiderToRaces(riderId: number, riderRaceData: { [eventId: string]: number }) {
        // Automatically selects this rider for ALL races they participate in.
        const current = { ...this.raceSelections };
        let modified = false;

        Object.keys(riderRaceData).forEach(raceKey => {
            const eventId = Number(raceKey);
            if (riderRaceData[raceKey] === 1) { // 1 means they are riding
                if (!current[eventId]) {
                    current[eventId] = [];
                }
                if (!current[eventId].includes(riderId)) {
                    current[eventId].push(riderId);
                    modified = true;
                }
            }
        });

        if (modified) {
            this.raceSelectionsSource.next(current);
            this.saveRaceSelectionsToStorage('default_race_selections', current);
        }
    }

    // selection string handling could be expanded here
    loadFromStorage(key: string) {
        const data = localStorage.getItem(key);
        if (data) {
            this.selectedRiderssource.next(JSON.parse(data));
        }

        const raceData = localStorage.getItem(key + '_race_selections');
        if (raceData) {
            this.raceSelectionsSource.next(JSON.parse(raceData));
        }
    }

    saveToStorage(key: string, riders: Rider[]) {
        localStorage.setItem(key, JSON.stringify(riders));
    }

    saveRaceSelectionsToStorage(key: string, selections: { [eventId: number]: number[] }) {
        localStorage.setItem(key, JSON.stringify(selections));
    }
}
