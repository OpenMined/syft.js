import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'lib/index.js',
      name: 'Syft',
      format: 'umd',
      sourcemap: true,
      globals: {
        '@tensorflow/tfjs': 'tf'
      }
    },
    {
      file: 'lib/index.esm.js',
      name: 'Syft',
      format: 'esm',
      sourcemap: true,
      globals: {
        '@tensorflow/tfjs': 'tf'
      }
    }
  ],
  plugins: [
    babel({
      presets: [['@babel/preset-env', { modules: false }]],
      plugins: ['@babel/plugin-proposal-object-rest-spread'],
      exclude: 'node_modules/**'
    }),
    resolve(),
    terser()
  ],
  // indicate which modules should be treated as external
  external: ['@tensorflow/tfjs']
};
