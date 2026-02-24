import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, setDoc, doc, docData, query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Rider } from './types';

@Injectable({
    providedIn: 'root'
})
export class FirestoreService {
    constructor(private firestore: Firestore) { }

    getAllRiders(): Observable<Rider[]> {
        const ridersRef = collection(this.firestore, 'riders');
        return collectionData(ridersRef, { idField: 'docId' }) as Observable<Rider[]>;
    }

    async saveRider(rider: Rider) {
        // We use the rider's ID as the document ID for easy lookup/updates
        const riderDoc = doc(this.firestore, `riders/${rider.id}`);
        return setDoc(riderDoc, rider);
    }

    async saveRidersBatch(riders: Rider[]) {
        // Note: Firestore batch writes are limited to 500 operations.
        // For simplicity, we'll iterate. For bulk imports, chunks of 500 with writeBatch is better.
        // Given the number of riders, we should probably just loop for now or implement batching.
        // console.log('Saving riders to Firestore...', riders.length);
        const promises = riders.map(r => this.saveRider(r));
        return Promise.all(promises);
    }

    getLastSyncAt(): Observable<Date | null> {
        const metadataCollection = collection(this.firestore, 'metadata');
        const syncDoc = doc(metadataCollection, 'ridersSync');
        return docData(syncDoc).pipe(
            map((data: any) => data && data["lastSyncAt"] ? new Date(data["lastSyncAt"]) : null)
        );
    }

    async saveLastSyncAt(date: Date) {
        const metadataCollection = collection(this.firestore, 'metadata');
        const syncDoc = doc(metadataCollection, 'ridersSync');
        return setDoc(syncDoc, { lastSyncAt: date.toISOString() }, { merge: true });
    }
}
