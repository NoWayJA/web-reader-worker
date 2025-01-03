// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';

export default {
	input: 'src/injector/src/inject.ts',
	output: {
		file: 'src/injector/dist/inject-single.js',
		format: 'iife',
		sourcemap: true
	},
	plugins: [
		typescript({
			tsconfig: './src/injector/tsconfig.json'
		})
	]
};