import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'lib/index.js',
    name: 'Syft',
    format: 'iife',
    sourceMap: 'inline'
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
