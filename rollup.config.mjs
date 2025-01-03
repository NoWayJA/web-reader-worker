// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
	input: 'src/injector/src/inject.ts',
	output: {
		file: 'src/injector/dist/inject-single.js',
		format: 'iife',
		sourcemap: true
	},
	plugins: [
		resolve(),
		commonjs(),
		typescript({
			tsconfig: './src/injector/tsconfig.json'
		})
	]
};