import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

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
    terser()
  ]
};
