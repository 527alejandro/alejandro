import {Provider} from '@angular/core';
import {bootstrapApp, WORKER_APP_ROUTER} from '@angular/platform-browser/worker_app';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {App} from './index_common';

export function main() {
  bootstrapApp(
      App, [WORKER_APP_ROUTER, new Provider(LocationStrategy, {useClass: HashLocationStrategy})]);
}
