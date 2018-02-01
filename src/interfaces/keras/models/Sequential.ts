import * as syft from '../../../syft'
import { Layer } from '../layers'
import { Optimizer } from '../optimizers'
import { Model } from '.'

export class Sequential implements Model {
  syft_model: syft.Sequential
  loss: syft.Model
  optimizer: Optimizer

  layers: Layer[] = []
  metrics: string[] = []

  compiled = false

  async add(
    layer: Layer
  ) {
    let self = this

    if (self.layers.length > 0) {
      // look to the previous layer to get the input shape for this layer
      layer.input_shape = self.layers[ self.layers.length - 1 ].output_shape

      // if layer doesn't know its output shape - it's probably dynamic
      if (layer.output_shape == null) {
        layer.output_shape = layer.input_shape
      }

      await layer.create()
    }

    self.layers.push(layer)

    // sometimes keras has single layers that actually correspond
    // to multiple syft layers - so they end up getting stored in
    // an ordered list called 'ordered_syft'
    for (let l of layer.ordered_syft) {
      self.syft_model.add(l)
    }
  }

  async compile(
    loss: string,
    optimizer: any,
    metrics: string[] = []
  ) {
    let self = this

    if (!self.compiled) {
      self.compiled = true

      if (loss === 'categorical_crossentropy') {
        self.loss = await syft.Model.Categorical_CrossEntropy.create()
      } else if (loss === 'mean_squared_error') {
        self.loss = await syft.Model.MSELoss.create()
      }

      self.optimizer = optimizer
      self.metrics = metrics

      // TODO: self.optimizer.init(syft_params=self.syft.parameters())
    } else {
      console.warn('Warning: Model already compiled... please rebuild from scratch if you need to change things')
    }

    return self
  }

  async summary() {
    // let self = this
    // TODO: self.syft_model.summary()
  }

  async fit(
    x_train: syft.Tensor,
    y_train: syft.Tensor,
    batch_size: number,
    epochs = 1,
    validation_data = null,
    log_interval = 1,
    verbose = false
  ) {
    let self = this
    return self.syft_model.fit(
      x_train,
      y_train,
      self.loss,
      self.optimizer.syft_optim,
      batch_size,
      epochs,
      log_interval,
      self.metrics,
      verbose
    )
  }

  async evaluate(
    test_input: syft.Tensor,
    test_target: syft.Tensor,
    batch_size: number,
    metrics: string[] = [],
    verbose = true
  ) {
    // TODO: let self = this
    // return self.syft_model.evaluate(
    //   test_input,
    //   test_target,
    //   self.loss,
    //   metrics=metrics,
    //   verbose=verbose,
    //   batch_size=batch_size
    // )
  }

  async predict(
    x: syft.Tensor
  ) {
    let self = this
    // if (type(x) === list):
    // x = np.array(x).astype('float')
    // if (type(x) === np.array or type(x) === np.ndarray):
    // x = FloatTensor(x,autograd=true, delete_after_use=false)

    return (await self.syft_model.forward(x)).to_numpy()
  }

  async get_weights(): Promise<syft.Tensor[]> {
    let self = this
    return self.syft_model.parameters()
  }

  async to_json() {
    // TODO: let self = this
    // let json_str = self.syft_model.to_json()
    //
    // let o = JSON.parse(json_str)
    //
    // o['config'][0]['config']['batch_input_shape'] = [null, self.layers[0].input_shape]
    //
    // let new_config: any [] = []
    // for (let layer of o['config']) {
    //   if (layer['class_name'] === 'Linear') {
    //     layer['class_name'] = 'Sequential'
    //     layer['config']['name'] = 'dense_' + layer['config']['name'].split('_')[-1]
    //   } else if (layer['class_name'] === 'Softmax') {
    //     new_config[-1]['config']['activation'] = 'softmax'
    //     continue
    //   } else if (layer['class_name'] === 'ReLU') {
    //     new_config[-1]['config']['activation'] = 'relu'
    //     continue
    //   }
    //   new_config.push(layer)
    // }
    // o['config'] = new_config
    //
    // return JSON.stringify(o)
  }
}
