import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RiderJsonComponent } from "./rider-json/rider-json.component";
import { RacesOverviewComponent } from "./races-overview/races-overview.component";
import { RacePlannerComponent } from "./race-planner/race-planner.component";

import { HomeComponent } from "./home/home.component";
import { GrandTourComponent } from "./grand-tour/grand-tour.component";

const routes: Routes = [
	{ path: '', component: HomeComponent, pathMatch: 'full' },
	{ path: 'voorjaarsklassiekers', redirectTo: 'planner', pathMatch: 'full' },
	{ path: 'grand-tour/:tourId', component: GrandTourComponent },
	{ path: 'grand-tour', redirectTo: 'grand-tour/tour', pathMatch: 'full' },
	{ path: 'giro', redirectTo: 'grand-tour/giro', pathMatch: 'full' },
	{ path: 'tour', redirectTo: 'grand-tour/tour', pathMatch: 'full' },
	{ path: 'vuelta', redirectTo: 'grand-tour/vuelta', pathMatch: 'full' },
	{ path: 'riders', component: RiderJsonComponent },
	{ path: 'overview', component: RacesOverviewComponent },
	{ path: 'planner', component: RacePlannerComponent },
	{ path: '**', redirectTo: '' }
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
