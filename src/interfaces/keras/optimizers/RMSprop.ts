// TODO: make syft.Optimizer.RMSprop
// import * as syft from '../../../syft'
//
// import { Optimizer } from '.'
//
// export class RMSprop implements Optimizer {
//   syft_optim: syft.RMSprop
//   hyperparameters: any
//
//
//   constructor(
//     hyperparameters: any
//   ) {
//     let self = this
//     self.hyperparameters = hyperparameters
//   }
//
//   async create(
//     syft_params: syft.Tensor
//   ) {
//     let self = this
//     self.syft_optim = await syft.Optimizer.RMSprop.create(syft_params, self.hyperparameters)
//   }
// }
