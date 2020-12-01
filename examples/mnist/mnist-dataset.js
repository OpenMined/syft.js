import { data } from '@openmined/syft.js';

/**
 * MNIST dataset
 */
export class MnistDataset extends data.Dataset {
  // These files are original MNIST dataset from http://yann.lecun.com/exdb/mnist/ hosted with `Content-Encoding: gzip` header
  // Header allows to download small compressed files and transparently unpack them with the browser
  TRAIN_IMAGES_URL = 'https://gzip-mnist.s3.us-east-2.amazonaws.com/mnist/train-images-idx3-ubyte.gz';
  TRAIN_LABELS_URL = 'https://gzip-mnist.s3.us-east-2.amazonaws.com/mnist/train-labels-idx1-ubyte.gz';
  TRAIN_SAMPLES_COUNT = 55000;
  TEST_IMAGES_URL = 'https://gzip-mnist.s3.us-east-2.amazonaws.com/mnist/t10k-images-idx3-ubyte.gz';
  TEST_LABELS_URL = 'https://gzip-mnist.s3.us-east-2.amazonaws.com/mnist/t10k-labels-idx1-ubyte.gz';
  TEST_SAMPLES_COUNT = 10000;
  IMAGE_SIZE = 28 * 28;

  constructor({train= true, transform} = {}) {
    super();
    this.train = train;
    this.samplesCount = this.train ? this.TRAIN_SAMPLES_COUNT : this.TEST_SAMPLES_COUNT;
    this.transform = transform;
  }

  /**
   * Loads the data from the web
   * @return {Promise<void>}
   */
  async load() {
    const imagesUrl = this.train ? this.TRAIN_IMAGES_URL : this.TEST_IMAGES_URL;
    const labelsUrl = this.train ? this.TRAIN_LABELS_URL : this.TEST_LABELS_URL;
    const [imagesResponse, labelsResponse] = await Promise.all([
      fetch(imagesUrl, {cache: "force-cache"}),
      fetch(labelsUrl, {cache: "force-cache"})
    ]);

    this.images = new Uint8Array(await imagesResponse.arrayBuffer(), 16);
    this.labels = new Uint8Array(await labelsResponse.arrayBuffer(), 8);
  }

  getItem(idx) {
    let item = [
      this.images.slice(idx * this.IMAGE_SIZE, (idx + 1) * this.IMAGE_SIZE),
      this.labels.slice(idx, idx + 1)
    ];

    if (this.transform) {
      item = this.transform.apply(...item);
    }

    return item;
  }

  get length() {
    return this.samplesCount;
  }
}