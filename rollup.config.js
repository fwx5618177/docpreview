import dts from 'rollup-plugin-dts'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'
import esbuild from 'rollup-plugin-esbuild'
import typescript from 'rollup-plugin-typescript2'
import babel from '@rollup/plugin-babel'
import sourceMaps from 'rollup-plugin-sourcemaps'
import multiEntry from '@rollup/plugin-multi-entry'

const entries = ['src/*.ts']
// const exclude = ['gulpfile.babel.ts']

const plugins = [
    multiEntry(),
    babel({
        babelrc: false,
        babelHelpers: 'bundled',
        presets: [['env', { modules: false }]],
    }),
    resolve({
        preferBuiltins: true,
    }),
    alias(),
    json(),
    typescript({
        exclude: ['node_modules/**', '**/test', '**/*.test.ts'],
        typescript: require('typescript'),
    }),
    commonjs(),
    esbuild(),
    sourceMaps(),
]

export default [
    ...entries.map(input => {
        // if (exclude.includes(input)) return {}
        return {
            input,
            output: [
                {
                    file: input.replace('src/', 'dist/').replace('.ts', '.mjs').replace('*', 'index'),
                    format: 'esm',
                },
                {
                    file: input.replace('src/', 'dist/').replace('.ts', '.cjs').replace('*', 'index'),
                    format: 'cjs',
                },
            ],
            external: [],
            plugins,
        }
    }),
    ...entries.map(input => {
        // if (exclude.includes(input)) return {}
        return {
            input,
            output: {
                file: input.replace('src/', 'dist/types/').replace('.ts', '.d.ts').replace('*', 'index'),
                format: 'esm',
            },
            external: [],
            plugins: [multiEntry(), dts({ respectExternal: true })],
        }
    }),
]
