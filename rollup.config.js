import babel from 'rollup-plugin-babel';
import builtins from '@joseph184/rollup-plugin-node-builtins';
import json from 'rollup-plugin-json';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';

import pkg from './package.json';

const sharedOutput = {
  name: 'syft',
  sourcemap: true,
  exports: 'named',
  globals: {
    '@tensorflow/tfjs-core': 'tf'
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
    builtins({crypto: true}),
    json(),
    peerDepsExternal(),
    babel({ exclude: 'node_modules/**' }),
    resolve({
      preferBuiltins: true
    }),
    commonjs(),
    filesize()
  ]
};
