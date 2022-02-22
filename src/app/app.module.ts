import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RacesOverviewComponent } from './races-overview/races-overview.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatTableModule} from "@angular/material/table";
import {HttpClientModule} from "@angular/common/http";
import {MatSelectModule} from "@angular/material/select";
import {FormsModule} from "@angular/forms";
import {MatIconModule} from "@angular/material/icon";
import { RiderJsonComponent } from './rider-json/rider-json.component';
import { RiderCardComponent } from './races-overview/rider-card/rider-card.component';

@NgModule({
  declarations: [
    AppComponent,
    RacesOverviewComponent,
    RiderJsonComponent,
    RiderCardComponent
  ],
	imports: [
		BrowserModule,
		HttpClientModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		MatTableModule,
		MatSelectModule,
		FormsModule,
		MatIconModule
	],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
