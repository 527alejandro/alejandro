import {provide, Provider, ComponentResolver} from '@angular/core';
import {assertionsEnabled, Type, CONST_EXPR} from '@angular/facade';

export * from './template_ast';
export {TEMPLATE_TRANSFORMS} from './template_parser';
export {CompilerConfig, RenderTypes} from './config';
export * from './compile_metadata';
export * from './offline_compiler';
export {RuntimeCompiler} from './runtime_compiler';
export * from './url_resolver';
export * from './xhr';

export {ViewResolver} from './view_resolver';
export {DirectiveResolver} from './directive_resolver';
export {PipeResolver} from './pipe_resolver';

import {TemplateParser} from './template_parser';
import {HtmlParser} from './html_parser';
import {DirectiveNormalizer} from './directive_normalizer';
import {RuntimeMetadataResolver} from './runtime_metadata';
import {StyleCompiler} from './style_compiler';
import {ViewCompiler} from './view_compiler/view_compiler';
import {CompilerConfig} from './config';
import {RuntimeCompiler} from './runtime_compiler';
import {ElementSchemaRegistry} from './schema/element_schema_registry';
import {DomElementSchemaRegistry} from './schema/dom_element_schema_registry';
import {UrlResolver, DEFAULT_PACKAGE_URL_PROVIDER} from './url_resolver';
import {Parser} from './expression_parser/parser';
import {Lexer} from './expression_parser/lexer';
import {ViewResolver} from './view_resolver';
import {DirectiveResolver} from './directive_resolver';
import {PipeResolver} from './pipe_resolver';

function _createCompilerConfig() {
  return new CompilerConfig(assertionsEnabled(), false, true);
}

/**
 * A set of providers that provide `RuntimeCompiler` and its dependencies to use for
 * template compilation.
 */
export const COMPILER_PROVIDERS: Array<Type | Provider | any[]> = CONST_EXPR([
  Lexer,
  Parser,
  HtmlParser,
  TemplateParser,
  DirectiveNormalizer,
  RuntimeMetadataResolver,
  DEFAULT_PACKAGE_URL_PROVIDER,
  StyleCompiler,
  ViewCompiler,
  new Provider(CompilerConfig, {useFactory: _createCompilerConfig, deps: []}),
  RuntimeCompiler,
  new Provider(ComponentResolver, {useExisting: RuntimeCompiler}),
  DomElementSchemaRegistry,
  new Provider(ElementSchemaRegistry, {useExisting: DomElementSchemaRegistry}),
  UrlResolver,
  ViewResolver,
  DirectiveResolver,
  PipeResolver
]);
