import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RiderJsonComponent } from "./rider-json/rider-json.component";
import { RacesOverviewComponent } from "./races-overview/races-overview.component";
import { RacePlannerComponent } from "./race-planner/race-planner.component";

const routes: Routes = [
	{ path: 'riders', component: RiderJsonComponent },
	{ path: 'overview', component: RacesOverviewComponent },
	{ path: 'planner', component: RacePlannerComponent },
	{ path: '', redirectTo: 'overview', pathMatch: 'full' },
	{ path: '**', redirectTo: 'overview' }
]
	;

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
