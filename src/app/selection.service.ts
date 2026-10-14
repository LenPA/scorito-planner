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

    private raceCaptainsSource = new BehaviorSubject<{ [eventId: number]: { c1?: number, c2?: number, c3?: number } }>({});
    raceCaptains$ = this.raceCaptainsSource.asObservable();

    private readonly BUDGET_LIMIT = 45000000;
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

        if (rider.races) {
            this.autoAssignRiderToRaces(rider.id, rider.races);
        }
    }

    removeRider(rider: Rider) {
        const updated = this.selectedRiders.filter(r => r.id !== rider.id);
        this.selectedRiderssource.next(updated);
        this.saveToStorage('default', updated);

        // Also remove from all race selections and captaincies
        const currentRaceSelections = this.raceSelections;
        const currentCaptains = { ...this.raceCaptains };
        let modifiedSelections = false;
        let modifiedCaptains = false;

        Object.keys(currentRaceSelections).forEach(key => {
            const eventId = Number(key);
            if (currentRaceSelections[eventId] && currentRaceSelections[eventId].includes(rider.id)) {
                currentRaceSelections[eventId] = currentRaceSelections[eventId].filter(id => id !== rider.id);
                modifiedSelections = true;
            }
            if (currentCaptains[eventId]) {
                if (currentCaptains[eventId].c1 === rider.id) { currentCaptains[eventId].c1 = undefined; modifiedCaptains = true; }
                if (currentCaptains[eventId].c2 === rider.id) { currentCaptains[eventId].c2 = undefined; modifiedCaptains = true; }
                if (currentCaptains[eventId].c3 === rider.id) { currentCaptains[eventId].c3 = undefined; modifiedCaptains = true; }
            }
        });
        if (modifiedSelections) {
            this.raceSelectionsSource.next(currentRaceSelections);
            this.saveRaceSelectionsToStorage('default_race_selections', currentRaceSelections);
        }
        if (modifiedCaptains) {
            this.raceCaptainsSource.next(currentCaptains);
            this.saveCaptainsToStorage('default_race_captains', currentCaptains);
        }
    }

    isSelected(riderId: number): boolean {
        return this.selectedRiders.some(r => r.id === riderId);
    }

    get remainingBudget(): number {
        const spent = this.selectedRiders.reduce((acc, rider) => acc + Number(rider.price), 0);
        return this.BUDGET_LIMIT - spent;
    }

    get riderCount(): number {
        return this.selectedRiders.length;
    }

    get raceSelections(): { [eventId: number]: number[] } {
        return this.raceSelectionsSource.value;
    }

    get raceCaptains(): { [eventId: number]: { c1?: number, c2?: number, c3?: number } } {
        return this.raceCaptainsSource.value;
    }

    updateRaceSelection(eventId: number, riderIds: number[]) {
        const current = { ...this.raceSelections };
        current[eventId] = riderIds;
        this.raceSelectionsSource.next(current);
        this.saveRaceSelectionsToStorage('default_race_selections', current);

        // Remove captains if they were deselected from the race
        const currentCaptains = { ...this.raceCaptains };
        let capsModified = false;
        if (currentCaptains[eventId]) {
            ['c1', 'c2', 'c3'].forEach(cLevel => {
                const captainId = (currentCaptains[eventId] as any)[cLevel];
                if (captainId && !riderIds.includes(captainId)) {
                    (currentCaptains[eventId] as any)[cLevel] = undefined;
                    capsModified = true;
                }
            });
        }
        if (capsModified) {
            this.raceCaptainsSource.next(currentCaptains);
            this.saveCaptainsToStorage('default_race_captains', currentCaptains);
        }
    }

    setCaptain(eventId: number, captainLevel: 1 | 2 | 3, riderId: number | undefined) {
        const current = { ...this.raceCaptains };
        if (!current[eventId]) {
            current[eventId] = {};
        }

        // Prevent adding a rider who isn't selected for this race
        if (riderId && (!this.raceSelections[eventId] || !this.raceSelections[eventId].includes(riderId))) {
            return;
        }

        // If the rider is already another captain slot, clear that slot
        if (riderId) {
            if (current[eventId].c1 === riderId && captainLevel !== 1) current[eventId].c1 = undefined;
            if (current[eventId].c2 === riderId && captainLevel !== 2) current[eventId].c2 = undefined;
            if (current[eventId].c3 === riderId && captainLevel !== 3) current[eventId].c3 = undefined;
        }

        if (captainLevel === 1) current[eventId].c1 = riderId;
        if (captainLevel === 2) current[eventId].c2 = riderId;
        if (captainLevel === 3) current[eventId].c3 = riderId;

        this.raceCaptainsSource.next(current);
        this.saveCaptainsToStorage('default_race_captains', current);
    }

    syncWithDatabase(dbRiders: Rider[]) {
        let selectedModified = false;
        const newSelected: Rider[] = [];
        const toRemove: Rider[] = [];

        this.selectedRiders.forEach(selRider => {
            const dbRider = dbRiders.find(r => r.id === selRider.id);
            if (dbRider) {
                if (dbRider.races) {
                    this.autoAssignRiderToRaces(dbRider.id, dbRider.races);
                }
                if (JSON.stringify(selRider) !== JSON.stringify(dbRider)) {
                    selectedModified = true;
                    newSelected.push(dbRider);
                } else {
                    newSelected.push(selRider);
                }
            } else {
                // Rider no longer in database, mark for complete removal
                toRemove.push(selRider);
            }
        });

        if (toRemove.length > 0) {
            selectedModified = true;
            const currentRaceSelections = { ...this.raceSelections };
            const currentCaptains = { ...this.raceCaptains };
            let modifiedSelections = false;
            let modifiedCaptains = false;

            toRemove.forEach(removedRider => {
                Object.keys(currentRaceSelections).forEach(key => {
                    const eventId = Number(key);
                    if (currentRaceSelections[eventId] && currentRaceSelections[eventId].includes(removedRider.id)) {
                        currentRaceSelections[eventId] = currentRaceSelections[eventId].filter(id => id !== removedRider.id);
                        modifiedSelections = true;
                    }
                    if (currentCaptains[eventId]) {
                        if (currentCaptains[eventId].c1 === removedRider.id) { currentCaptains[eventId].c1 = undefined; modifiedCaptains = true; }
                        if (currentCaptains[eventId].c2 === removedRider.id) { currentCaptains[eventId].c2 = undefined; modifiedCaptains = true; }
                        if (currentCaptains[eventId].c3 === removedRider.id) { currentCaptains[eventId].c3 = undefined; modifiedCaptains = true; }
                    }
                });
            });

            if (modifiedSelections) {
                this.raceSelectionsSource.next(currentRaceSelections);
                this.saveRaceSelectionsToStorage('default_race_selections', currentRaceSelections);
            }
            if (modifiedCaptains) {
                this.raceCaptainsSource.next(currentCaptains);
                this.saveCaptainsToStorage('default_race_captains', currentCaptains);
            }
        }

        if (selectedModified) {
            this.selectedRiderssource.next(newSelected);
            this.saveToStorage('default', newSelected);
        }
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

    private mustHaveIdsSource = new BehaviorSubject<number[]>([]);
    mustHaveIds$ = this.mustHaveIdsSource.asObservable();

    get mustHaveIds(): number[] {
        return this.mustHaveIdsSource.value;
    }

    toggleMustHave(riderId: number) {
        const current = [...this.mustHaveIds];
        const idx = current.indexOf(riderId);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(riderId);
        }
        this.mustHaveIdsSource.next(current);
        localStorage.setItem('default_must_haves', JSON.stringify(current));
    }

    isMustHave(riderId: number): boolean {
        return this.mustHaveIds.includes(riderId);
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

        const captainsData = localStorage.getItem(key + '_race_captains');
        if (captainsData) {
            this.raceCaptainsSource.next(JSON.parse(captainsData));
        }

        const mustHaveData = localStorage.getItem('default_must_haves');
        if (mustHaveData) {
            this.mustHaveIdsSource.next(JSON.parse(mustHaveData));
        }
    }

    saveToStorage(key: string, riders: Rider[]) {
        localStorage.setItem(key, JSON.stringify(riders));
    }

    saveRaceSelectionsToStorage(key: string, selections: { [eventId: number]: number[] }) {
        localStorage.setItem(key, JSON.stringify(selections));
    }

    saveCaptainsToStorage(key: string, captains: { [eventId: number]: { c1?: number, c2?: number, c3?: number } }) {
        localStorage.setItem(key, JSON.stringify(captains));
    }
}
