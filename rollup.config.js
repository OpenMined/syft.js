import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    file: 'lib/index.js',
    name: 'Syft',
    format: 'iife',
    sourceMap: true
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    // TODO: This is wildly inefficient... we need to cut down on this build
    resolve()
  ]
};
