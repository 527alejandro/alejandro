/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Public Test Library for unit testing Angular applications. Assumes that you are running
 * with Jasmine, Mocha, or a similar framework which exports a beforeEach function and
 * allows tests to be asynchronous by either returning a promise or using a 'done' parameter.
 */

import {resetFakeAsyncZone} from './fake_async';
import {TestBed} from './test_bed';

declare var global: any;

const _global = <any>(typeof window === 'undefined' ? global : window);

let resetTestingModuleInBeforeEach = true;

// Reset the test providers and the fake async zone before each test.
if (_global.beforeEach) {
  _global.beforeEach(() => {
    if (resetTestingModuleInBeforeEach) TestBed.resetTestingModule();
    resetFakeAsyncZone();
  });
}

/**
 * By default, Angular calls TestBed.resetTestingModule in Jasmine's beforeEach.
 * This is not always necessary and can slow down test execution.
 * Calling disableTestBedAutoReset disables this behavior.
 */
export function disableTestBedAutoReset() {
  resetTestingModuleInBeforeEach = false;
}

/**
 * Reenable the automatic TestBed reset.
 */
export function enableTestBedAutoReset() {
  resetTestingModuleInBeforeEach = true;
<<<<<<< HEAD
}
=======
}
>>>>>>> dac4928... feat(core): allow tests to disable the automatic calls of TestBed.resetTestingModule in beforeEach
