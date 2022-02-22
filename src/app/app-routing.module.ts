import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {RiderJsonComponent} from "./rider-json/rider-json.component";
import {RacesOverviewComponent} from "./races-overview/races-overview.component";

const routes: Routes = [
	{path: 'riders', component: RiderJsonComponent},
	{path: '**', component: RacesOverviewComponent}
]
;

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
