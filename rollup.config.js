import babel from 'rollup-plugin-babel';
import builtins from 'rollup-plugin-node-builtins';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';

import pkg from './package.json';

const sharedOutput = {
  name: 'syft',
  sourcemap: true,
  globals: {
    '@tensorflow/tfjs': 'tf'
  }
};

export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.browser,
      format: 'umd',
      ...sharedOutput
    },
    {
      file: pkg.main,
      format: 'cjs',
      ...sharedOutput
    },
    {
      file: pkg.module,
      format: 'es',
      ...sharedOutput
    }
  ],
  plugins: [
    builtins(),
    peerDepsExternal(),
    babel({ exclude: 'node_modules/**' }),
    resolve({
      preferBuiltins: true
    }),
    commonjs(),
    filesize()
  ]
};
