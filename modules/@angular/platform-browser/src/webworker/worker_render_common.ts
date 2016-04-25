import {CONST_EXPR, IS_DART} from '@angular/facade';
import {MessageBus} from '../web_workers/shared/message_bus';
import {NgZone} from '@angular/core/src/zone/ng_zone';
import {
  ExceptionHandler,
  APPLICATION_COMMON_PROVIDERS,
  PLATFORM_COMMON_PROVIDERS,
  RootRenderer,
  PLATFORM_INITIALIZER
} from '@angular/core';
import {Provider, Injector, OpaqueToken} from '@angular/core/src/di';
import {DOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {DomEventsPlugin} from '@angular/platform-browser/src/dom/events/dom_events';
import {KeyEventsPlugin} from '@angular/platform-browser/src/dom/events/key_events';
import {HammerGesturesPlugin} from '@angular/platform-browser/src/dom/events/hammer_gestures';
import {DOCUMENT} from '@angular/platform-browser/src/dom/dom_tokens';
import {DomRootRenderer, DomRootRenderer_} from '@angular/platform-browser/src/dom/dom_renderer';
import {
  DomSharedStylesHost,
  SharedStylesHost
} from '@angular/platform-browser/src/dom/shared_styles_host';
import {BrowserDetails} from '../animate/browser_details';
import {AnimationBuilder} from '../animate/animation_builder';
import {XHR} from '@angular/compiler';
import {XHRImpl} from '@angular/platform-browser/src/browser/xhr_impl';
import {Testability} from '@angular/core/src/testability/testability';
import {BrowserGetTestability} from '@angular/platform-browser/src/browser/testability';
import {BrowserDomAdapter} from '../browser/browser_adapter';
import {wtfInit} from '@angular/core/src/profile/wtf_init';
import {MessageBasedRenderer} from '../web_workers/ui/renderer';
import {MessageBasedXHRImpl} from '../web_workers/ui/xhr_impl';
import {
  ServiceMessageBrokerFactory,
  ServiceMessageBrokerFactory_
} from '../web_workers/shared/service_message_broker';
import {
  ClientMessageBrokerFactory,
  ClientMessageBrokerFactory_
} from '../web_workers/shared/client_message_broker';
import {BrowserPlatformLocation} from '@angular/platform-browser/src/browser/location/browser_platform_location';
import {Serializer} from '../web_workers/shared/serializer';
import {ON_WEB_WORKER} from '../web_workers/shared/api';
import {RenderStore} from '../web_workers/shared/render_store';
import {HAMMER_GESTURE_CONFIG, HammerGestureConfig} from '../dom/events/hammer_gestures';
import {EventManager, EVENT_MANAGER_PLUGINS} from '../dom/events/event_manager';
// TODO change these imports once dom_adapter is moved out of core

export const WORKER_SCRIPT: OpaqueToken = CONST_EXPR(new OpaqueToken("WebWorkerScript"));

// Message based Worker classes that listen on the MessageBus
export const WORKER_RENDER_MESSAGING_PROVIDERS: Array<any /*Type | Provider | any[]*/> =
    CONST_EXPR([MessageBasedRenderer, MessageBasedXHRImpl]);

export const WORKER_RENDER_PLATFORM_MARKER =
    CONST_EXPR(new OpaqueToken('WorkerRenderPlatformMarker'));

export const WORKER_RENDER_PLATFORM: Array<any /*Type | Provider | any[]*/> = CONST_EXPR([
  PLATFORM_COMMON_PROVIDERS,
  CONST_EXPR(new Provider(WORKER_RENDER_PLATFORM_MARKER, {useValue: true})),
  new Provider(PLATFORM_INITIALIZER, {useValue: initWebWorkerRenderPlatform, multi: true})
]);

/**
 * A list of {@link Provider}s. To use the router in a Worker enabled application you must
 * include these providers when setting up the render thread.
 */
export const WORKER_RENDER_ROUTER: Array<any /*Type | Provider | any[]*/> =
    CONST_EXPR([BrowserPlatformLocation]);

export const WORKER_RENDER_APPLICATION_COMMON: Array<any /*Type | Provider | any[]*/> = CONST_EXPR([
  APPLICATION_COMMON_PROVIDERS,
  WORKER_RENDER_MESSAGING_PROVIDERS,
  new Provider(ExceptionHandler, {useFactory: _exceptionHandler, deps: []}),
  new Provider(DOCUMENT, {useFactory: _document, deps: []}),
  // TODO(jteplitz602): Investigate if we definitely need EVENT_MANAGER on the render thread
  // #5298
  new Provider(EVENT_MANAGER_PLUGINS, {useClass: DomEventsPlugin, multi: true}),
  new Provider(EVENT_MANAGER_PLUGINS, {useClass: KeyEventsPlugin, multi: true}),
  new Provider(EVENT_MANAGER_PLUGINS, {useClass: HammerGesturesPlugin, multi: true}),
  new Provider(HAMMER_GESTURE_CONFIG, {useClass: HammerGestureConfig}),
  new Provider(DomRootRenderer, {useClass: DomRootRenderer_}),
  new Provider(RootRenderer, {useExisting: DomRootRenderer}),
  new Provider(SharedStylesHost, {useExisting: DomSharedStylesHost}),
  new Provider(XHR, {useClass: XHRImpl}),
  MessageBasedXHRImpl,
  new Provider(ServiceMessageBrokerFactory, {useClass: ServiceMessageBrokerFactory_}),
  new Provider(ClientMessageBrokerFactory, {useClass: ClientMessageBrokerFactory_}),
  Serializer,
  new Provider(ON_WEB_WORKER, {useValue: false}),
  RenderStore,
  DomSharedStylesHost,
  Testability,
  BrowserDetails,
  AnimationBuilder,
  EventManager
]);

export function initializeGenericWorkerRenderer(injector: Injector) {
  var bus = injector.get(MessageBus);
  let zone = injector.get(NgZone);
  bus.attachToZone(zone);

  zone.runGuarded(() => {
    WORKER_RENDER_MESSAGING_PROVIDERS.forEach((token) => { injector.get(token).start(); });
  });
}

export function initWebWorkerRenderPlatform(): void {
  BrowserDomAdapter.makeCurrent();
  wtfInit();
  BrowserGetTestability.init();
}

function _exceptionHandler(): ExceptionHandler {
  return new ExceptionHandler(DOM, !IS_DART);
}

function _document(): any {
  return DOM.defaultDoc();
}
