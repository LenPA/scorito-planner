// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  cyclingBaseUrl: "", // empty = use proxy (proxy.conf.json forwards /cycling and /cyclingteammanager)
  firebase: {
    apiKey: "AIzaSyDz4JJIAqVzDQYnAOUXYeVFDROL9I-wsBU",
    authDomain: "scorito-planner.firebaseapp.com",
    projectId: "scorito-planner",
    storageBucket: "scorito-planner.firebasestorage.app",
    messagingSenderId: "309514639904",
    appId: "1:309514639904:web:7c8cff0382b2b43bf47a45",
    measurementId: "G-FW51Z77J29"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
