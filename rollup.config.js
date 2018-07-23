import babel from 'rollup-plugin-babel';

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
    })
  ]
};
