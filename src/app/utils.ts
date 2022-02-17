// import {Observable, Subscriber} from "rxjs";
// import {ScoritoQueryGateway} from "./scorito-query-gateway";
// import {InjectorProvider} from "./injector-provider";
//
//
// export function sendQuery(type: string, payload: any, options ?: any): Observable<any> {
// 	if (!InjectorProvider.injector) {
// 		return new Observable((subscriber: Subscriber<any>) => {
// 			InjectorProvider.injector.get(ScoritoQueryGateway).sendRequest(type, payload, options).subscribe(subscriber);
// 		});
// 	}
// 	return InjectorProvider.injector.get(ScoritoQueryGateway).sendRequest(type, payload, options);
// }
