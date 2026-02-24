import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RacesOverviewComponent } from './races-overview/races-overview.component';
import { RacePlannerComponent } from './race-planner/race-planner.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
import { HttpClientModule } from "@angular/common/http";
import { MatTableModule } from "@angular/material/table";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { RiderJsonComponent } from './rider-json/rider-json.component';
import { RiderCardComponent } from './races-overview/rider-card/rider-card.component';
import { TeamSummaryComponent } from './team-summary/team-summary.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

registerLocaleData(localeNl, 'nl-NL');

@NgModule({
    declarations: [
        AppComponent,
        RacesOverviewComponent,
        RiderJsonComponent,
        RiderCardComponent,
        TeamSummaryComponent,
        RacePlannerComponent
    ],
    imports: [
        BrowserModule,
        CommonModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        HttpClientModule,
        MatTableModule,
        MatSelectModule,
        FormsModule,
        MatIconModule
    ],
    providers: [
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore())
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
