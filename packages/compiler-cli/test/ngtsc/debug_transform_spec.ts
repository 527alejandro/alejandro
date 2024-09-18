/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {runInEachFileSystem} from '../../src/ngtsc/file_system/testing';
import {loadStandardTestFiles} from '../../src/ngtsc/testing';
import * as esbuild from 'esbuild';

import {NgtscTestEnvironment} from './env';

const testFiles = loadStandardTestFiles();

const DEBUG_NAME = 'debugName';

const minifiedDevBuildOptions = {
  minifySyntax: true,
  treeShaking: true,
  keepNames: true,
  define: {ngDevMode: 'true'},
};

const minifiedProdBuildOptions = {
  minifySyntax: true,
  treeShaking: true,
  keepNames: true,
  define: {ngDevMode: 'false'},
};

runInEachFileSystem(() => {
  describe('Debug Info Typescript tranformation', () => {
    let env!: NgtscTestEnvironment;

    beforeEach(() => {
      env = NgtscTestEnvironment.setup(testFiles);
      env.tsconfig();
    });

    describe('signal', () => {
      it('should not insert debug info into signal function if not imported from angular core', () => {
        env.write(
          'test.ts',
          `
                declare function signal(value: any): any;
                const testSignal = signal('Hello World');
            `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        expect(jsContents).not.toContain(DEBUG_NAME);
      });

      it('should insert debug info into signal function if imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {signal} from '@angular/core';
                const testSignal = signal('Hello World');
            `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        expect(jsContents).toContain(
          `signal('Hello World', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testSignal" }] : []))`,
        );
      });

      describe('Variable Declaration Case', () => {
        it('should tree-shake away debug info if in prod mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal} from '@angular/core';
                    const testSignal = signal('Hello World');
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).not.toContain(DEBUG_NAME);
          expect(builtContent).toContain('signal("Hello World")');
        });

        it('should not tree-shake away debug info if in dev mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal} from '@angular/core';
                    const testSignal = signal('Hello World');
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(`signal("Hello World", { debugName: "testSignal" });`);
        });

        it('should insert debug info into signal function that already has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal} from '@angular/core';
                    const testSignal = signal('Hello World', { equal: () => true });
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `signal('Hello World', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testSignal", equal: () => true }] : [{ equal: () => true }]))`,
          );
        });

        it('should tree-shake away debug info if in prod mode for signal function that has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal} from '@angular/core';
                    const testSignal = signal('Hello World', { equal: () => true });
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).toContain(
            `signal("Hello World", { equal: /* @__PURE__ */ __name(() => !0, "equal") });`,
          );
          expect(builtContent).not.toContain('ngDevMode');
          expect(builtContent).not.toContain(DEBUG_NAME);
        });
      });

      describe('Property Declaration Case', () => {
        it('should insert debug info into signal function', () => {
          env.write(
            'test.ts',
            `
                    import {signal, Component} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal = signal('Hello World');
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `signal('Hello World', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testSignal" }] : []))`,
          );
        });

        it('should tree-shake away debug info if in prod mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, Component} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal = signal('Hello World');
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).not.toContain(DEBUG_NAME);
          expect(builtContent).toContain('signal("Hello World")');
        });

        it('should not tree-shake away debug info if in dev mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, Component} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal = signal('Hello World');
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(`signal("Hello World", { debugName: "testSignal" });`);
        });

        it('should insert debug info into signal function that already has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, Component} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal = signal('Hello World', { equal: () => true });
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `signal('Hello World', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testSignal", equal: () => true }] : [{ equal: () => true }]))`,
          );
        });

        it('should tree-shake away debug info if in prod mode for signal function that has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, Component} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal = signal('Hello World', { equal: () => true });
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).toContain(
            `signal("Hello World", { equal: /* @__PURE__ */ __name(() => !0, "equal") });`,
          );
          expect(builtContent).not.toContain('ngDevMode');
          expect(builtContent).not.toContain(DEBUG_NAME);
        });
      });

      describe('Property Assignment Case', () => {
        it('should insert debug info into signal function', () => {
          env.write(
            'test.ts',
            `
                    import {signal, Component, WritableSignal} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal: WritableSignal<string>;
                        constructor() {
                            this.testSignal = signal('Hello World');
                        }
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `signal('Hello World', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testSignal" }] : []))`,
          );
        });

        it('should tree-shake away debug info if in prod mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, Component, WritableSignal} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal: WritableSignal<string>;
                        constructor() {
                            this.testSignal = signal('Hello World');
                        }
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).not.toContain(DEBUG_NAME);
          expect(builtContent).toContain('signal("Hello World")');
        });

        it('should not tree-shake away debug info if in dev mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, Component, WritableSignal} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal: WritableSignal<string>;
                        constructor() {
                            this.testSignal = signal('Hello World');
                        }
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(`signal("Hello World", { debugName: "testSignal" });`);
        });

        it('should insert debug info into signal function that already has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, Component, WritableSignal} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal: WritableSignal<string>;
                        constructor() {
                            this.testSignal = signal('Hello World', { equal: () => true });
                        }
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `signal('Hello World', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testSignal", equal: () => true }] : [{ equal: () => true }]))`,
          );
        });

        it('should tree-shake away debug info if in prod mode for signal function that has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, Component, WritableSignal} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal: WritableSignal<string>;
                        constructor() {
                            this.testSignal = signal('Hello World', { equal: () => true });
                        }
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).toContain(
            `signal("Hello World", { equal: /* @__PURE__ */ __name(() => !0, "equal") });`,
          );
          expect(builtContent).not.toContain('ngDevMode');
          expect(builtContent).not.toContain(DEBUG_NAME);
        });
      });
    });

    describe('computed', () => {
      it('should not insert debug info into computed function if not imported from angular core', () => {
        env.write(
          'test.ts',
          `
                declare function computed(fn: () => any): any;
                const testComputed = computed(() => 123);
            `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        expect(jsContents).not.toContain(DEBUG_NAME);
      });

      it('should insert debug info into computed function if imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {signal, computed} from '@angular/core';
                const testSignal = signal(123);
                const testComputed = computed(() => testSignal());
                `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        expect(jsContents).toContain(
          `computed(() => testSignal(), ...(ngDevMode ? [{ ${DEBUG_NAME}: "testComputed" }] : []))`,
        );
      });

      describe('Variable Declaration Case', () => {
        it('should tree-shake away debug info if in prod mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed} from '@angular/core';
                    const testSignal = signal(123);
                    const testComputed = computed(() => testSignal());
                    `,
          );
          env.driveMain();
          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).not.toContain(DEBUG_NAME);
          expect(builtContent).toContain('computed(() => testSignal())');
        });

        it('should not tree-shake away debug info if in dev mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed} from '@angular/core';
                    const testSignal = signal(123);
                    const testComputed = computed(() => testSignal());
                    `,
          );
          env.driveMain();
          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(
            `computed(() => testSignal(), { ${DEBUG_NAME}: "testComputed" })`,
          );
        });

        it('should insert debug info into computed function that already has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed} from '@angular/core';
                    const testSignal = signal(123);
                    const testComputed = computed(() => testSignal(), { equal: () => true });
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `computed(() => testSignal(), ...(ngDevMode ? [{ debugName: "testComputed", equal: () => true }] : [{ equal: () => true }]))`,
          );
        });

        it('should tree-shake away debug info if in prod mode for computed function that has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed} from '@angular/core';
                    const testSignal = signal(123);
                    const testComputed = computed(() => testSignal(), { equal: () => true });
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).toContain(
            `testComputed = computed(() => testSignal(), { equal: /* @__PURE__ */ __name(() => !0, "equal")`,
          );
          expect(builtContent).not.toContain('ngDevMode');
          expect(builtContent).not.toContain(DEBUG_NAME);
        });

        it('should not tree-shake away debug info if in dev mode and has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed} from '@angular/core';
                    const testSignal = signal(123);
                    const testComputed = computed(() => testSignal(), { equal: () => true });
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(
            `testComputed = computed(() => testSignal(), { debugName: "testComputed", equal: /* @__PURE__ */ __name(() => !0, "equal") });`,
          );
        });
      });

      describe('Property Declaration Case', () => {
        it('should tree-shake away debug info if in prod mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testSignal = signal(123);
                        testComputed = computed(() => this.testSignal());
                    }
                    `,
          );
          env.driveMain();
          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).not.toContain(DEBUG_NAME);
          expect(builtContent).toContain('computed(() => this.testSignal())');
        });

        it('should not tree-shake away debug info if in dev mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testSignal = signal(123);
                        testComputed = computed(() => this.testSignal());
                    }
                    `,
          );
          env.driveMain();
          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(
            `computed(() => this.testSignal(), { ${DEBUG_NAME}: "testComputed" })`,
          );
        });

        it('should insert debug info into computed function that already has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testSignal = signal(123);
                        testComputed = computed(() => this.testSignal(), { equal: () => true });
                    }
                    `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `computed(() => this.testSignal(), ...(ngDevMode ? [{ debugName: "testComputed", equal: () => true }] : [{ equal: () => true }]))`,
          );
        });

        it('should tree-shake away debug info if in prod mode for computed function that has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testSignal = signal(123);
                        testComputed = computed(() => this.testSignal(), { equal: () => true });
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).toContain(
            `computed(() => this.testSignal(), { equal: /* @__PURE__ */ __name(() => !0, "equal")`,
          );
          expect(builtContent).not.toContain('ngDevMode');
          expect(builtContent).not.toContain(DEBUG_NAME);
        });

        it('should not tree-shake away debug info if in dev mode and has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testSignal = signal(123);
                        testComputed = computed(() => this.testSignal(), { equal: () => true });
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(
            `computed(() => this.testSignal(), { debugName: "testComputed", equal: /* @__PURE__ */ __name(() => !0, "equal") });`,
          );
        });
      });

      describe('Property Assignment Case', () => {
        it('should tree-shake away debug info if in prod mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed, Component, WritableSignal, Signal} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal: WritableSignal<number>;
                        testComputed: Signal<number>;
                        constructor() {
                            this.testSignal = signal(123);
                            this.testComputed = computed(() => this.testSignal());
                        }
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).not.toContain(DEBUG_NAME);
          expect(builtContent).toContain('computed(() => this.testSignal())');
        });

        it('should not tree-shake away debug info if in dev mode', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed, Component, WritableSignal, Signal} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent
                    {
                        testSignal: WritableSignal<number>;
                        testComputed: Signal<number>;
                        constructor() {
                            this.testSignal = signal(123);
                            this.testComputed = computed(() => this.testSignal());
                        }
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(
            `computed(() => this.testSignal(), { debugName: "testComputed" })`,
          );
        });

        it('should insert debug info into computed function that already has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed, Component, WritableSignal, Signal} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent {
                        testSignal: WritableSignal<number>;
                        testComputed: Signal<number>;
                        constructor() {
                            this.testSignal = signal(123);
                            this.testComputed = computed(() => this.testSignal(), { equal: () => true });
                        }
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `computed(() => this.testSignal(), ...(ngDevMode ? [{ debugName: "testComputed", equal: () => true }] : [{ equal: () => true }]))`,
          );
        });

        it('should tree-shake away debug info if in prod mode for computed function that has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed, Component, WritableSignal, Signal} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent {
                        testSignal: WritableSignal<number>;
                        testComputed: Signal<number>;
                        constructor() {
                            this.testSignal = signal(123);
                            this.testComputed = computed(() => this.testSignal(), { equal: () => true });
                        }
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).toContain(
            `computed(() => this.testSignal(), { equal: /* @__PURE__ */ __name(() => !0, "equal")`,
          );
          expect(builtContent).not.toContain('ngDevMode');
          expect(builtContent).not.toContain(DEBUG_NAME);
        });

        it('should not tree-shake away debug info if in dev mode and has custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {signal, computed, Component, WritableSignal, Signal} from '@angular/core';

                    @Component({
                        template: ''
                    }) class MyComponent {
                        testSignal: WritableSignal<number>;
                        testComputed: Signal<number>;
                        constructor() {
                            this.testSignal = signal(123);
                            this.testComputed = computed(() => this.testSignal(), { equal: () => true });
                        }
                    }
                `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(
            `computed(() => this.testSignal(), { debugName: "testComputed", equal: /* @__PURE__ */ __name(() => !0, "equal") });`,
          );
        });
      });
    });

    describe('model', () => {
      it('should not insert debug info into model function if not imported from angular core', () => {
        env.write(
          'test.ts',
          `
                declare function model(value: any): any;
                import {Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testModel = model('Hello World');
                }
            `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        expect(jsContents).not.toContain(DEBUG_NAME);
      });

      it('should insert debug info into model function if imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {model, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testModel = model('Hello World');
                }
                `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        expect(jsContents).toContain(
          `model('Hello World', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testModel" }] : []))`,
        );
      });

      it('should tree-shake away debug info if in prod mode', async () => {
        env.write(
          'test.ts',
          `
                import {model, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testModel = model('Hello World');
                }
                `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('model("Hello World")');
      });

      describe('.required', () => {
        it('should insert debug info into .required', () => {
          env.write(
            'test.ts',
            `
                    import {model, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testModel = model.required();
                    }
                    `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `model.required(...(ngDevMode ? [{ ${DEBUG_NAME}: "testModel" }] : []))`,
          );
        });

        it('should insert debug info into .required that already has custom options', () => {
          env.write(
            'test.ts',
            `
                    import {model, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testModel = model.required({ alias: 'testModelAlias' });
                    }
                    `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `model.required(...(ngDevMode ? [{ debugName: "testModel", alias: 'testModelAlias' }] : [{ alias: 'testModelAlias' }]))`,
          );
        });

        it('should tree-shake away debug info if in prod mode', async () => {
          env.write(
            'test.ts',
            `
                    import {model, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testModel = model.required();
                    }
                    `,
          );
          env.driveMain();
          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).not.toContain(DEBUG_NAME);
          expect(builtContent).toContain('model.required();');
        });

        it('should not tree-shake away debug info if in dev mode', async () => {
          env.write(
            'test.ts',
            `
                    import {model, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testModel = model.required();
                    }
                    `,
          );
          env.driveMain();
          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(`model.required({ ${DEBUG_NAME}: "testModel" });`);
        });

        it('should tree-shake away debug info if in prod mode with custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {model, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testModel = model.required({ alias: 'testModelAlias' });
                    }
                    `,
          );
          env.driveMain();
          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).not.toContain(DEBUG_NAME);
          expect(builtContent).toContain('model.required({ alias: "testModelAlias" });');
        });

        it('should not tree-shake away debug info if in dev mode with custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {model, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testModel = model.required({ alias: 'testModelAlias' });
                    }
                    `,
          );
          env.driveMain();
          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(
            `model.required({ debugName: "testModel", alias: "testModelAlias" });`,
          );
        });
      });
    });

    describe('input', () => {
      it('should not insert debug info into input function if not imported from angular core', () => {
        env.write(
          'test.ts',
          `
                declare function input(): any;
                import {Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testInput = input();
                }
            `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        expect(jsContents).not.toContain(DEBUG_NAME);
      });

      it('should insert debug info into input function if imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {input, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testInput = input();
                }
            `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        expect(jsContents).toContain(
          `input(...(ngDevMode ? [{ ${DEBUG_NAME}: "testInput" }] : []))`,
        );
      });

      it('should tree-shake away debug info if in prod mode', async () => {
        env.write(
          'test.ts',
          `
                import {input, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testInput = input();
                }
            `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('input()');
      });

      describe('.required', () => {
        it('should insert debug info into .required', () => {
          env.write(
            'test.ts',
            `
                    import {input, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testInput = input.required();
                    }
                    `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `input.required(...(ngDevMode ? [{ ${DEBUG_NAME}: "testInput" }] : []))`,
          );
        });

        it('should insert debug info into .required that already has custom options', () => {
          env.write(
            'test.ts',
            `
                    import {input, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testInput = input.required({ alias: 'testInputAlias' });
                    }
                    `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          expect(jsContents).toContain(
            `input.required(...(ngDevMode ? [{ debugName: "testInput", alias: 'testInputAlias' }] : [{ alias: 'testInputAlias' }]))`,
          );
        });

        it('should tree-shake away debug info if in prod mode', async () => {
          env.write(
            'test.ts',
            `
                    import {input, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testInput = input.required();
                    }
                    `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).not.toContain(DEBUG_NAME);
          expect(builtContent).toContain('input.required();');
        });

        it('should not tree-shake away debug info if in dev mode', async () => {
          env.write(
            'test.ts',
            `
                    import {input, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testInput = input.required();
                    }
                    `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(`input.required({ ${DEBUG_NAME}: "testInput" });`);
        });

        it('should tree-shake away debug info if in prod mode with custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {input, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testInput = input.required({ alias: 'testInputAlias' });
                    }
                    `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
          expect(builtContent).not.toContain(DEBUG_NAME);
          expect(builtContent).toContain('input.required({ alias: "testInputAlias" });');
        });

        it('should not tree-shake away debug info if in dev mode with custom options', async () => {
          env.write(
            'test.ts',
            `
                    import {input, Component} from '@angular/core';
    
                    @Component({
                        template: ''
                    }) class MyComponent {
                        testInput = input.required({ alias: 'testInputAlias' });
                    }
                    `,
          );
          env.driveMain();

          const jsContents = env.getContents('test.js');
          const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
          expect(builtContent).toContain(
            `input.required({ debugName: "testInput", alias: "testInputAlias" });`,
          );
        });
      });
    });

    describe('viewChild', () => {
      it('should not insert debug info into viewChild function if not imported from angular core', () => {
        env.write(
          'test.ts',
          `
                declare function viewChild(value: any): any;
                import {Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChild = viewChild('foo');
                }
            `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        expect(jsContents).not.toContain(DEBUG_NAME);
      });

      it('should insert debug info into viewChild function if imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {viewChild, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChild = viewChild('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        expect(jsContents).toContain(
          `viewChild('foo', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testViewChild" }] : []))`,
        );
      });

      it('should tree-shake away debug info if in prod mode', async () => {
        env.write(
          'test.ts',
          `
                import {viewChild, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChild = viewChild('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('viewChild("foo")');
      });

      it('should not tree-shake away debug info if in dev mode', async () => {
        env.write(
          'test.ts',
          `
                import {viewChild, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChild = viewChild('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
        expect(builtContent).toContain(`viewChild("foo", { ${DEBUG_NAME}: "testViewChild" })`);
      });

      it('should tree-shake away debug info if in prod mode with existing options', async () => {
        env.write(
          'test.ts',
          `
                import {viewChild, Component, ElementRef} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChild = viewChild('foo', { read: ElementRef });
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('viewChild("foo", { read: ElementRef })');
      });

      it('should not tree-shake away debug info if in dev mode with existing options', async () => {
        env.write(
          'test.ts',
          `
                import {viewChild, Component, ElementRef} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChild = viewChild('foo', { read: ElementRef });
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
        expect(builtContent).toContain(
          `viewChild("foo", { ${DEBUG_NAME}: "testViewChild", read: ElementRef })`,
        );
      });
    });

    describe('viewChildren', () => {
      it('should not insert debug info into viewChildren function if not imported from angular core', () => {
        env.write(
          'test.ts',
          `
                declare function viewChildren(value: any): any;
                import {Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChildren = viewChildren('foo');
                }
            `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        expect(jsContents).not.toContain(DEBUG_NAME);
      });

      it('should insert debug info into viewChildren function if imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {viewChildren, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChildren = viewChildren('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        expect(jsContents).toContain(
          `viewChildren('foo', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testViewChildren" }] : []))`,
        );
      });

      it('should tree-shake away debug info if in prod mode', async () => {
        env.write(
          'test.ts',
          `
                import {viewChildren, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChildren = viewChildren('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('viewChildren("foo")');
      });

      it('should not tree-shake away debug info if in dev mode', async () => {
        env.write(
          'test.ts',
          `
                import {viewChildren, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChildren = viewChildren('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
        expect(builtContent).toContain(
          `viewChildren("foo", { ${DEBUG_NAME}: "testViewChildren" })`,
        );
      });

      it('should tree-shake away debug info if in prod mode with existing options', async () => {
        env.write(
          'test.ts',
          `
                import {viewChildren, Component, ElementRef} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChild = viewChildren('foo', { read: ElementRef });
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('viewChildren("foo", { read: ElementRef })');
      });

      it('should not tree-shake away debug info if in dev mode with existing options', async () => {
        env.write(
          'test.ts',
          `
                import {viewChildren, Component, ElementRef} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testViewChild = viewChildren('foo', { read: ElementRef });
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
        expect(builtContent).toContain(
          `viewChildren("foo", { ${DEBUG_NAME}: "testViewChild", read: ElementRef })`,
        );
      });
    });

    describe('contentChild', () => {
      it('should not insert debug info into contentChild function if not imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {Component} from '@angular/core';
                declare function contentChild(value: any): any;

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChild = contentChild('foo');
                }
            `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        expect(jsContents).not.toContain(DEBUG_NAME);
      });

      it('should insert debug info into contentChild function if imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {contentChild, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChild = contentChild('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        expect(jsContents).toContain(
          `contentChild('foo', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testContentChild" }] : []))`,
        );
      });

      it('should tree-shake away debug info if in prod mode', async () => {
        env.write(
          'test.ts',
          `
                import {contentChild, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChild = contentChild('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('contentChild("foo")');
      });

      it('should not tree-shake away debug info if in dev mode', async () => {
        env.write(
          'test.ts',
          `
                import {contentChild, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChild = contentChild('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
        expect(builtContent).toContain(
          `contentChild("foo", { ${DEBUG_NAME}: "testContentChild" })`,
        );
      });

      it('should tree-shake away debug info if in prod mode with existing options', async () => {
        env.write(
          'test.ts',
          `
                 import {contentChild, Component, ElementRef} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChild = contentChild('foo', { read: ElementRef });
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('contentChild("foo", { read: ElementRef })');
      });

      it('should not tree-shake away debug info if in dev mode with existing options', async () => {
        env.write(
          'test.ts',
          `
                    import {contentChild, Component, ElementRef} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChild = contentChild('foo', { read: ElementRef });
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
        expect(builtContent).toContain(
          `contentChild("foo", { ${DEBUG_NAME}: "testContentChild", read: ElementRef })`,
        );
      });
    });

    describe('contentChildren', () => {
      it('should not insert debug info into contentChildren function if not imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {Component} from '@angular/core';

                declare function contentChildren(value: any): any;
                const testContentChildren = contentChildren('foo');

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChildren = contentChildren('foo');
                }
            `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        expect(jsContents).not.toContain(DEBUG_NAME);
      });

      it('should insert debug info into contentChildren function if imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {contentChildren, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChildren = contentChildren('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        expect(jsContents).toContain(
          `contentChildren('foo', ...(ngDevMode ? [{ ${DEBUG_NAME}: "testContentChildren" }] : []))`,
        );
      });

      it('should tree-shake away debug info if in prod mode', async () => {
        env.write(
          'test.ts',
          `
                import {contentChildren, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChildren = contentChildren('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('contentChildren("foo")');
      });

      it('should not tree-shake away debug info if in dev mode', async () => {
        env.write(
          'test.ts',
          `
                import {contentChildren, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChildren = contentChildren('foo');
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
        expect(builtContent).toContain(
          `contentChildren("foo", { ${DEBUG_NAME}: "testContentChildren" })`,
        );
      });

      it('should tree-shake away debug info if in prod mode with existing options', async () => {
        env.write(
          'test.ts',
          `
                import {contentChildren, Component, ElementRef} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChildren = contentChildren('foo', { read: ElementRef });
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('contentChildren("foo", { read: ElementRef })');
      });

      it('should not tree-shake away debug info if in dev mode with existing options', async () => {
        env.write(
          'test.ts',
          `
                import {contentChildren, Component, ElementRef} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testContentChildren = contentChildren('foo', { read: ElementRef });
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
        expect(builtContent).toContain(
          `contentChildren("foo", { ${DEBUG_NAME}: "testContentChildren", read: ElementRef })`,
        );
      });
    });

    describe('effect', () => {
      it('should not insert debug info into effect function if not imported from angular core', () => {
        env.write(
          'test.ts',
          `
                declare function signal(val: any): any;
                declare function effect(fn: () => any): any;
                import {Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testSignal = signal(123);
                    testEffect = effect(() => this.testSignal());
                }
            `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        expect(jsContents).not.toContain(DEBUG_NAME);
      });

      it('should insert debug info into effect function if imported from angular core', () => {
        env.write(
          'test.ts',
          `
                import {signal, effect, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testSignal = signal(123);
                    testEffect = effect(() => this.testSignal());
                }
                `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        expect(jsContents).toContain(
          `effect(() => this.testSignal(), ...(ngDevMode ? [{ ${DEBUG_NAME}: "testEffect" }] : []))`,
        );
      });

      it('should tree-shake away debug info if in prod mode', async () => {
        env.write(
          'test.ts',
          `
                import {signal, effect, Component} from '@angular/core';
                @Component({
                    template: ''
                }) class MyComponent {
                    testSignal = signal(123);
                    testEffect = effect(() => this.testSignal());
                }
                `,
        );
        env.driveMain();
        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain('effect(() => this.testSignal())');
      });

      it('should not tree-shake away debug info if in dev mode', async () => {
        env.write(
          'test.ts',
          `
                import {signal, effect, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testSignal = signal(123);
                    testEffect = effect(() => this.testSignal());
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
        expect(builtContent).toContain(
          `effect(() => this.testSignal(), { ${DEBUG_NAME}: "testEffect" })`,
        );
      });

      it('should tree-shake away debug info if in prod mode with existing options', async () => {
        env.write(
          'test.ts',
          `
                import {signal, effect, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testSignal = signal(123);
                    testEffect = effect(() => this.testSignal(), { manualCleanup: true, allowSignalWrites: true });
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedProdBuildOptions)).code;
        expect(builtContent).not.toContain(DEBUG_NAME);
        expect(builtContent).toContain(
          'effect(() => this.testSignal(), { manualCleanup: !0, allowSignalWrites: !0 })',
        );
      });

      it('should not tree-shake away debug info if in dev mode with existing options', async () => {
        env.write(
          'test.ts',
          `
                import {signal, effect, Component} from '@angular/core';

                @Component({
                    template: ''
                }) class MyComponent {
                    testSignal = signal(123);
                    testEffect = effect(() => this.testSignal(), { manualCleanup: true, allowSignalWrites: true });
                }
                `,
        );
        env.driveMain();

        const jsContents = env.getContents('test.js');
        const builtContent = (await esbuild.transform(jsContents, minifiedDevBuildOptions)).code;
        expect(builtContent).toContain(
          `effect(() => this.testSignal(), { ${DEBUG_NAME}: "testEffect", manualCleanup: !0, allowSignalWrites: !0 })`,
        );
      });
    });
  });
});
