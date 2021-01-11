jest.mock('@tensorflow/tfjs-core', () => {
  const tfJsVersion = process.env.TFJS_VERSION || 'tfjs2';
  let originalModule = jest.requireActual(tfJsVersion);
  return {
    __esModule: true,
    ...originalModule,
  };
});

const tfJsVersion = process.env.TFJS_VERSION || 'tfjs2';
const tfJsBackend = process.env.TFJS_BACKEND || 'wasm';

if (tfJsVersion == 'tfjs2') {
  import('@tensorflow/tfjs-core');
  if (tfJsBackend == 'wasm') {
    import('@tensorflow/tfjs-backend-wasm');
  } else if (tfJsBackend == 'cpu') {
    import('@tensorflow/tfjs-backend-cpu');
  }
}
