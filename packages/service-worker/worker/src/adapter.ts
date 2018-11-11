/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Adapts the service worker to its runtime environment.
 *
 * Mostly, this is used to mock out identifiers which are otherwise read
 * from the global scope.
 */
export class Adapter {
  ngsw = 'ngsw';
  /**
   * Wrapper around the `Request` constructor.
   */
  newRequest(input: string|Request, init?: RequestInit): Request {
    return new Request(input, init);
  }

  /**
   * Wrapper around the `Response` constructor.
   */
  newResponse(body: any, init?: ResponseInit) { return new Response(body, init); }

  /**
   * Wrapper around the `Headers` constructor.
   */
  newHeaders(headers: {[name: string]: string}): Headers { return new Headers(headers); }

  /**
   * Test if a given object is an instance of `Client`.
   */
  isClient(source: any): source is Client { return (source instanceof Client); }

  /**
   * Read the current UNIX time in milliseconds.
   */
  get time(): number { return Date.now(); }

  /**
   * Extract the pathname of a URL.
   */
  parseUrl(url: string, relativeTo: string): {origin: string, path: string} {
    const parsed = new URL(url, relativeTo);
    return {origin: parsed.origin, path: parsed.pathname};
  }

  /**
   * Wait for a given amount of time before completing a Promise.
   */
  timeout(ms: number): Promise<void> {
    return new Promise<void>(resolve => { setTimeout(() => resolve(), ms); });
  }

  /**
  * suffixing the baseHref with `ngsw` string to avoid clash of cache files
  * in same domain with multiple apps
  */
  setBaseHref(baseHref: string) {
    if (baseHref && ['/'].indexOf(baseHref) == -1) {
      const str = baseHref.replace(/^\//, '').replace(/\/$/, '').replace(/\//, ':');
      this.ngsw += ':' + str;
    }
  }
}

/**
 * An event context in which an operation is taking place, which allows
 * the delaying of Service Worker shutdown until certain triggers occur.
 */
export interface Context {
  /**
   * Delay shutdown of the Service Worker until the given promise resolves.
   */
  waitUntil(fn: Promise<any>): void;
}
