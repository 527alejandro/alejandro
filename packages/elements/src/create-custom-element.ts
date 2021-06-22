/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injector, Type} from '@angular/core';
import {Subscription} from 'rxjs';

import {ComponentNgElementStrategyFactory} from './component-factory-strategy';
import {newCustomElementWithBehavior, NgElement, NgElementBehavior} from './custom-element-impl';
import {NgElementStrategy, NgElementStrategyFactory} from './element-strategy';
import {createCustomEvent, getComponentInputs, getDefaultAttributeToPropertyInputs} from './utils';

/**
 * Prototype for a class constructor based on an Angular component
 * that can be used for custom element registration. Implemented and returned
 * by the {@link createCustomElement createCustomElement() function}.
 *
 * @see [Angular Elements Overview](guide/elements "Turning Angular components into custom elements")
 *
 * @publicApi
 */
export interface NgElementConstructor<P> {
  /**
   * An array of observed attribute names for the custom element,
   * derived by transforming input property names from the source component.
   */
  readonly observedAttributes: string[];

  /**
   * Initializes a constructor instance.
   * @param injector If provided, overrides the configured injector.
   */
  new(injector?: Injector): NgElement&WithProperties<P>;
}

/**
 * Additional type information that can be added to the NgElement class,
 * for properties that are added based
 * on the inputs and methods of the underlying component.
 *
 * @publicApi
 */
export type WithProperties<P> = {
  [property in keyof P]: P[property]
};

class EmptyBase {}

/**
 * A configuration that initializes an NgElementConstructor with the
 * dependencies and strategy it needs to transform a component into
 * a custom element class.
 *
 * @publicApi
 */
export interface NgElementConfig {
  /**
   * The injector to use for retrieving the component's factory.
   */
  injector: Injector;
  /**
   * An optional custom strategy factory to use instead of the default.
   * The strategy controls how the transformation is performed.
   */
  strategyFactory?: NgElementStrategyFactory;
}

/**
 *  @description Creates a custom element class based on an Angular component.
 *
 * Builds a class that encapsulates the functionality of the provided component and
 * uses the configuration information to provide more context to the class.
 * Takes the component factory's inputs and outputs to convert them to the proper
 * custom element API and add hooks to input changes.
 *
 * The configuration's injector is the initial injector set on the class,
 * and used by default for each created instance.This behavior can be overridden with the
 * static property to affect all newly created instances, or as a constructor argument for
 * one-off creations.
 *
 * @see [Angular Elements Overview](guide/elements "Turning Angular components into custom elements")
 *
 * @param component The component to transform.
 * @param config A configuration that provides initialization information to the created class.
 * @returns The custom-element construction class, which can be registered with
 * a browser's `CustomElementRegistry`.
 *
 * @publicApi
 */
export function createCustomElement<P>(
    component: Type<any>, config: NgElementConfig): NgElementConstructor<P> {
  const inputs = getComponentInputs(component, config.injector);

  const strategyFactory =
      config.strategyFactory || new ComponentNgElementStrategyFactory(component, config.injector);

  const attributeToPropertyInputs = getDefaultAttributeToPropertyInputs(inputs);

  const NgElementImplCtor = newCustomElementWithBehavior(baseClass => {
    class NgElementImpl extends baseClass implements NgElementBehavior<NgElementImpl> {
      // Work around a bug in closure typed optimizations(b/79557487) where it is not honoring
      // static field externs. So using quoted access to explicitly prevent renaming.
      static readonly['observedAttributes'] = Object.keys(attributeToPropertyInputs);

      private ngElementEventsSubscription: Subscription|null = null;

      get ngElementStrategy(): NgElementStrategy {
        // NOTE:
        // Some polyfills (e.g. `document-register-element`) do not call the constructor,
        // therefore it is not safe to set `ngElementStrategy` in the constructor and assume it
        // will be available inside the methods.
        //
        // TODO(andrewseguin): Add e2e tests that cover cases where the constructor isn't
        // called. For now this is tested using a Google internal test suite.
        if (!this._ngElementStrategy) {
          const strategy = this._ngElementStrategy =
              strategyFactory.create(this.injector || config.injector);

          // Re-apply pre-existing input values (set as properties on the element) through the
          // strategy.
          inputs.forEach(({propName}) => {
            if (!this.htmlElement.hasOwnProperty(propName)) {
              // No pre-existing value for `propName`.
              return;
            }

            // Delete the property from the instance and re-apply it through the strategy.
            const value = (this.htmlElement as any)[propName];
            delete (this.htmlElement as any)[propName];
            strategy.setInputValue(propName, value);
          });
        }

        return this._ngElementStrategy!;
      }

      private _ngElementStrategy?: NgElementStrategy;

      get behavior(): NgElementImpl {
        return this;
      }

      /**
       * The actual custom element (`HTMLElement` instance).
       *
       * Depending on how custom element construction is configured, this is either `this`, or a
       * separate `HTMLElement` instance.
       */
      private htmlElement: HTMLElement;

      constructor(private readonly injector?: Injector, htmlElement?: HTMLElement) {
        super();

        // Depending on the mode by which this custom element was defined, either `this` is also the
        // custom element (`HTMLElement`) instance, or there's a separate element instance that was
        // passed into the constructor.
        if (htmlElement !== undefined) {
          this.htmlElement = htmlElement;
        } else {
          this.htmlElement = (this as unknown as HTMLElement);
        }
      }

      attributeChangedCallback(
          attrName: string, oldValue: string|null, newValue: string, namespace?: string): void {
        const propName = attributeToPropertyInputs[attrName]!;
        this.ngElementStrategy.setInputValue(propName, newValue);
      }

      connectedCallback(): void {
        // For historical reasons, some strategies may not have initialized the `events` property
        // until after `connect()` is run. Subscribe to `events` if it is available before running
        // `connect()` (in order to capture events emitted suring inittialization), otherwise
        // subscribe afterwards.
        //
        // TODO: Consider deprecating/removing the post-connect subscription in a future major
        // version
        //       (e.g. v11).

        let subscribedToEvents = false;

        if (this.ngElementStrategy.events) {
          // `events` are already available: Subscribe to it asap.
          this.subscribeToEvents();
          subscribedToEvents = true;
        }

        this.ngElementStrategy.connect(this.htmlElement);

        if (!subscribedToEvents) {
          // `events` were not initialized before running `connect()`: Subscribe to them now.
          // The events emitted during the component initialization have been missed, but at least
          // future events will be captured.
          this.subscribeToEvents();
        }
      }

      disconnectedCallback(): void {
        // Not using `this.ngElementStrategy` to avoid unnecessarily creating the
        // `NgElementStrategy`.
        if (this._ngElementStrategy) {
          this._ngElementStrategy.disconnect();
        }

        if (this.ngElementEventsSubscription) {
          this.ngElementEventsSubscription.unsubscribe();
          this.ngElementEventsSubscription = null;
        }
      }

      private subscribeToEvents(): void {
        // Listen for events from the strategy and dispatch them as custom events.
        this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe(e => {
          const customEvent = createCustomEvent(this.htmlElement.ownerDocument!, e.name, e.value);
          this.htmlElement.dispatchEvent(customEvent);
        });
      }
    }

    return NgElementImpl;
  });

  // Add getters and setters to the prototype for each property input.
  inputs.forEach(({propName}) => {
    Object.defineProperty(NgElementImplCtor.prototype, propName, {
      get(this: InstanceType<typeof NgElementImplCtor>): any {
        return this.behavior.ngElementStrategy.getInputValue(propName);
      },
      set(this: InstanceType<typeof NgElementImplCtor>, newValue: any): void {
        this.behavior.ngElementStrategy.setInputValue(propName, newValue);
      },
      configurable: true,
      enumerable: true,
    });
  });

  return (NgElementImplCtor as any) as NgElementConstructor<P>;
}
