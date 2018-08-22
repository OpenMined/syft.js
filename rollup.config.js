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
      sourcemap: true
    },
    {
      file: 'lib/index.esm.js',
      name: 'Syft',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    resolve({
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      }
    }),
    terser()
  ],
  // indicate which modules should be treated as external
  external: ['@tensorflow/tfjs']
};
