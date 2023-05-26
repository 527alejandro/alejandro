/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AnimationMetadata, AnimationPlayer, AnimationTriggerMetadata} from '@angular/animations';
import {DOCUMENT} from '@angular/common';
import {ApplicationRef, Inject, Injectable, OnDestroy} from '@angular/core';

import {TriggerAst} from '../dsl/animation_ast';
import {buildAnimationAst} from '../dsl/animation_ast_builder';
import {AnimationStyleNormalizer} from '../dsl/animation_style_normalizer';
import {AnimationTrigger, buildTrigger} from '../dsl/animation_trigger';
import {triggerBuildFailed} from '../error_helpers';
import {warnTriggerBuild} from '../warning_helpers';

import {AnimationDriver} from './animation_driver';
import {parseTimelineCommand} from './shared';
import {TimelineAnimationEngine} from './timeline_animation_engine';
import {TransitionAnimationEngine} from './transition_animation_engine';


@Injectable({providedIn: 'root'})
export class AnimationEngine implements OnDestroy {
  private _transitionEngine: TransitionAnimationEngine;
  private _timelineEngine: TimelineAnimationEngine;

  private _triggerCache: {[key: string]: AnimationTrigger} = {};

  // this method is designed to be overridden by the code that uses this engine
  public onRemovalComplete = (element: any, context: any) => {};

  // The `ApplicationRef` is injected here explicitly to force the dependency ordering.
  // Since the `ApplicationRef` should be created earlier before the `AnimationEngine`, they
  // both have `ngOnDestroy` hooks and `flush()` must be called after all views are destroyed.
  constructor(
      @Inject(DOCUMENT) doc: Document, private _driver: AnimationDriver,
      private _normalizer: AnimationStyleNormalizer, appRef: ApplicationRef) {
    this._transitionEngine = new TransitionAnimationEngine(doc.body, _driver, _normalizer);
    this._timelineEngine = new TimelineAnimationEngine(doc.body, _driver, _normalizer);

    this._transitionEngine.onRemovalComplete = (element: any, context: any) =>
        this.onRemovalComplete(element, context);
  }

  ngOnDestroy(): void {
    this.flush();
  }

  registerTrigger(
      componentId: string, namespaceId: string, hostElement: any, name: string,
      metadata: AnimationTriggerMetadata): void {
    const cacheKey = componentId + '-' + name;
    let trigger = this._triggerCache[cacheKey];
    if (!trigger) {
      const errors: Error[] = [];
      const warnings: string[] = [];
      const ast = buildAnimationAst(
                      this._driver, metadata as AnimationMetadata, errors, warnings) as TriggerAst;
      if (errors.length) {
        throw triggerBuildFailed(name, errors);
      }
      if (warnings.length) {
        warnTriggerBuild(name, warnings);
      }
      trigger = buildTrigger(name, ast, this._normalizer);
      this._triggerCache[cacheKey] = trigger;
    }
    this._transitionEngine.registerTrigger(namespaceId, name, trigger);
  }

  register(namespaceId: string, hostElement: any) {
    this._transitionEngine.register(namespaceId, hostElement);
  }

  destroy(namespaceId: string, context: any) {
    this._transitionEngine.destroy(namespaceId, context);
  }

  onInsert(namespaceId: string, element: any, parent: any, insertBefore: boolean): void {
    this._transitionEngine.insertNode(namespaceId, element, parent, insertBefore);
  }

  onRemove(namespaceId: string, element: any, context: any, isHostElement?: boolean): void {
    this._transitionEngine.removeNode(namespaceId, element, isHostElement || false, context);
  }

  disableAnimations(element: any, disable: boolean) {
    this._transitionEngine.markElementAsDisabled(element, disable);
  }

  process(namespaceId: string, element: any, property: string, value: any) {
    if (property.charAt(0) == '@') {
      const [id, action] = parseTimelineCommand(property);
      const args = value as any[];
      this._timelineEngine.command(id, element, action, args);
    } else {
      this._transitionEngine.trigger(namespaceId, element, property, value);
    }
  }

  listen(
      namespaceId: string, element: any, eventName: string, eventPhase: string,
      callback: (event: any) => any): () => any {
    // @@listen
    if (eventName.charAt(0) == '@') {
      const [id, action] = parseTimelineCommand(eventName);
      return this._timelineEngine.listen(id, element, action, callback);
    }
    return this._transitionEngine.listen(namespaceId, element, eventName, eventPhase, callback);
  }

  flush(microtaskId: number = -1): void {
    this._transitionEngine.flush(microtaskId);
  }

  get players(): AnimationPlayer[] {
    return (this._transitionEngine.players as AnimationPlayer[])
        .concat(this._timelineEngine.players as AnimationPlayer[]);
  }

  whenRenderingDone(): Promise<any> {
    return this._transitionEngine.whenRenderingDone();
  }
}
