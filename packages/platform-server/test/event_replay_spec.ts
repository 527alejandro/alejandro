/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DOCUMENT} from '@angular/common';
import {Component, destroyPlatform, getPlatform, Type} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {bootstrapApplication, provideClientHydration} from '@angular/platform-browser';
import {withEventReplay} from '@angular/platform-browser/src/hydration';

import {provideServerRendering} from '../public_api';
import {EVENT_DISPATCH_SCRIPT_ID, renderApplication} from '../src/utils';

import {getAppContents} from './dom_utils';

/**
 * Represents the <script> tag added by the build process to inject
 * event dispatch (JSAction) logic.
 */
const EVENT_DISPATCH_SCRIPT = `<script type="text/javascript" id="${EVENT_DISPATCH_SCRIPT_ID}"></script>`;

/** Checks whether event dispatch script is present in the generated HTML */
function hasEventDispatchScript(content: string) {
  return content.includes(EVENT_DISPATCH_SCRIPT_ID);
}

/** Checks whether there are any `jsaction` attributes present in the generated HTML */
function hasJSActionAttrs(content: string) {
  return content.includes('jsaction="');
}

describe('event replay', () => {
  beforeEach(() => {
    if (getPlatform()) destroyPlatform();
  });

  afterAll(() => {
    destroyPlatform();
  });

  describe('dom serialization', () => {
    let doc: Document;

    beforeEach(() => {
      doc = TestBed.inject(DOCUMENT);
    });

    afterEach(() => {
      doc.body.textContent = '';
    });

    /**
     * This renders the application with server side rendering logic.
     *
     * @param component the test component to be rendered
     * @param doc the document
     * @param envProviders the environment providers
     * @returns a promise containing the server rendered app as a string
     */
    async function ssr(
      component: Type<unknown>,
      options?: {doc?: string; enableEventReplay?: boolean},
    ): Promise<string> {
      const enableEventReplay = options?.enableEventReplay ?? true;
      const defaultHtml = `<html><head></head><body>${EVENT_DISPATCH_SCRIPT}<app></app></body></html>`;
      const hydrationProviders = enableEventReplay
        ? provideClientHydration(withEventReplay())
        : provideClientHydration();
      const providers = [provideServerRendering(), hydrationProviders];

      const bootstrap = () => bootstrapApplication(component, {providers});

      return renderApplication(bootstrap, {
        document: options?.doc ?? defaultHtml,
      });
    }

    describe('server rendering', () => {
      it('should serialize event types to be listened to and jsaction', async () => {
        @Component({
          standalone: true,
          selector: 'app',
          template: `
            <div (click)="onClick()">
                <div (blur)="onClick()"></div>
            </div>
          `,
        })
        class SimpleComponent {
          onClick() {}
        }

        const doc = `<html><head></head><body><app></app></body></html>`;
        const html = await ssr(SimpleComponent, {doc});
        const ssrContents = getAppContents(html);
        expect(
          ssrContents.startsWith(
            `<script>window.__jsaction_bootstrap('ngContracts', document.body, "ng", ["click","blur"]);</script>`,
          ),
        ).toBeTrue();
        expect(ssrContents).toContain('<div jsaction="click:"><div jsaction="blur:"></div></div>');
      });

      describe('event dispatch script', () => {
        it('should not be present on a page if there are no events to replay', async () => {
          @Component({
            standalone: true,
            selector: 'app',
            template: 'Some text',
          })
          class SimpleComponent {}

          const doc = `<html><head></head><body>${EVENT_DISPATCH_SCRIPT}<app></app></body></html>`;
          const html = await ssr(SimpleComponent, {doc});
          const ssrContents = getAppContents(html);

          expect(hasJSActionAttrs(ssrContents)).toBeFalse();
          expect(hasEventDispatchScript(ssrContents)).toBeFalse();
        });

        it('should not be present on a page where event replay is not enabled', async () => {
          @Component({
            standalone: true,
            selector: 'app',
            template: '<input (click)="onClick()" />',
          })
          class SimpleComponent {
            onClick() {}
          }

          const doc = `<html><head></head><body>${EVENT_DISPATCH_SCRIPT}<app></app></body></html>`;
          const html = await ssr(SimpleComponent, {doc, enableEventReplay: false});
          const ssrContents = getAppContents(html);

          // Expect that there are no JSAction artifacts in the HTML
          // (even though there are events in a template), since event
          // replay is disabled in the config.
          expect(hasJSActionAttrs(ssrContents)).toBeFalse();
          expect(hasEventDispatchScript(ssrContents)).toBeFalse();
        });

        it('should be retained if there are events to replay', async () => {
          @Component({
            standalone: true,
            selector: 'app',
            template: '<input (click)="onClick()" />',
          })
          class SimpleComponent {
            onClick() {}
          }

          const doc = `<html><head></head><body>${EVENT_DISPATCH_SCRIPT}<app></app></body></html>`;
          const html = await ssr(SimpleComponent, {doc});
          const ssrContents = getAppContents(html);

          expect(hasJSActionAttrs(ssrContents)).toBeTrue();
          expect(hasEventDispatchScript(ssrContents)).toBeTrue();
        });
      });
    });
  });
});
