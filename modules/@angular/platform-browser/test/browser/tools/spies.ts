import {SpyObject} from '@angular/testing/testing_internal';
import {ReflectiveInjector, provide} from '@angular/core';
import {global} from '@angular/facade';
import {ApplicationRef, ApplicationRef_} from '@angular/core/src/application_ref';

export class SpyApplicationRef extends SpyObject {
  constructor() { super(ApplicationRef_); }
}

export class SpyComponentRef extends SpyObject {
  injector;
  constructor() {
    super();
    this.injector = ReflectiveInjector.resolveAndCreate(
        [provide(ApplicationRef, {useClass: SpyApplicationRef})]);
  }
}

export function callNgProfilerTimeChangeDetection(config?): void {
  (<any>global).ng.profiler.timeChangeDetection(config);
}
