import { default as proto } from '../../src/proto';
import { runReplacers, SIMPLIFY_REPLACERS } from '../../src/serde';
import { List, Tuple, Dict } from '../../src/types/native';
import { Plan, Procedure, State } from '../../src/types/plan';
import { TorchTensor } from '../../src/types/torch';

import { Operation } from '../../src/types/message';
import PointerTensor from '../../src/types/pointer-tensor';
import { TorchSize } from '../../src/types/torch';

// ----- PROCEDURE ----- //
export const detailedFirstOperationPointerTensor = new PointerTensor(25208484331, 51684948173, 'dan', null, new TorchSize([1]), true); // prettier-ignore
export const detailedSecondOperationPointerTensor = new PointerTensor(9655331350, 62869536441, 'dan', null, null, true); // prettier-ignore
export const detailedThirdOperationPointerTensor = new PointerTensor(89426198911, 4863941835, 'dan', null, new TorchSize([1]), false); // prettier-ignore

export const simplifiedFirstOperationPointerTensor = runReplacers(
  `(${proto['syft.generic.pointers.pointer_tensor.PointerTensor']}, (25208484331, 51684948173, (${proto['str']}, (b'dan')), None, (${proto['torch.Size']}, (1,)), True))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);
export const simplifiedSecondOperationPointerTensor = runReplacers(
  `(${proto['syft.generic.pointers.pointer_tensor.PointerTensor']}, (9655331350, 62869536441, (${proto['str']}, (b'dan')), None, None, True))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);
export const simplifiedThirdOperationPointerTensor = runReplacers(
  `(${proto['syft.generic.pointers.pointer_tensor.PointerTensor']}, (89426198911, 4863941835, (${proto['str']}, (b'dan')), None, (${proto['torch.Size']}, (1,)), False))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

export const detailedFirstOperation = new Operation(
  new Tuple('abs', detailedFirstOperationPointerTensor, new Tuple(), new Dict()), // prettier-ignore
  new List(62869536441)
);
export const detailedSecondOperation = new Operation(
  new Tuple('__add__', detailedSecondOperationPointerTensor, new Tuple(detailedThirdOperationPointerTensor), new Dict()), // prettier-ignore
  new List(3263650475)
);

export const simplifiedFirstOperation = runReplacers(
  `(${proto['syft.messaging.message.Operation']}, ((${proto['tuple']}, ((${proto['str']}, (b'abs')), ${simplifiedFirstOperationPointerTensor}, (${proto['tuple']}, ()), (${proto['dict']}, ()))), (${proto['list']}, (62869536441,))))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);
export const simplifiedSecondOperation = runReplacers(
  `(${proto['syft.messaging.message.Operation']}, ((${proto['tuple']}, ((${proto['str']}, (b'__add__')), ${simplifiedSecondOperationPointerTensor}, (${proto['tuple']}, (${simplifiedThirdOperationPointerTensor},)), (${proto['dict']}, ()))), (${proto['list']}, (3263650475,))))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

export const detailedOperations = new Tuple(detailedFirstOperation, detailedSecondOperation); // prettier-ignore
export const simplifiedOperations = runReplacers(
  `(${proto['tuple']}, (${simplifiedFirstOperation}, ${simplifiedSecondOperation}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

export const detailedArgIds = new Tuple(51684948173);
export const detailedResultIds = new Tuple(3263650475);
export const detailedPromiseOutId = null;

export const detailedProcedure = new Procedure(detailedOperations, detailedArgIds, detailedResultIds, detailedPromiseOutId); // prettier-ignore
export const simplifiedProcedure = runReplacers(
  `(${proto['syft.messaging.plan.procedure.Procedure']}, (${simplifiedOperations}, (${proto['tuple']}, (51684948173,)), (${proto['tuple']}, (3263650475,)), None))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

// ----- STATE ----- //
export const detailedStateIds = new List(4863941835);
export const detailedTensors = new List(new TorchTensor(4863941835, 'somethinghere', null, null, null, null)); // prettier-ignore

export const simplifiedStateIdsList = runReplacers(
  `(${proto['list']}, (${detailedStateIds.join()},))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);
export const simplifiedTensorsList = runReplacers(
  `(${proto['list']}, ((${proto['torch.Tensor']}, (4863941835, (5,(b'somethinghere')), null, null, null, null)),))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

export const detailedState = new State(detailedStateIds, detailedTensors);
export const simplifiedState = runReplacers(
  `(${proto['syft.messaging.plan.state.State']}, (${simplifiedStateIdsList}, ${simplifiedTensorsList}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

export const id = 57895708650;
export const includeState = true;
export const isBuilt = true;
export const inputShape = new TorchSize([2]);
export const outputShape = null;
export const name = 'plan';
export const tags = null;
export const description = null;

export const simplifiedInputShape = `(${proto['torch.Size']}, (${inputShape.size}))`;
export const simplifiedPlanName = `(${proto['str']}, (b'${name}'))`;

export const detailedPlan = new Plan(id, detailedProcedure, detailedState, includeState, isBuilt, inputShape, outputShape, name, tags, description); // prettier-ignore
export const simplifiedPlan = runReplacers(
  `(${proto['syft.messaging.plan.plan.Plan']}, (${id}, ${simplifiedProcedure}, ${simplifiedState}, ${includeState}, ${isBuilt}, ${simplifiedInputShape}, None, ${simplifiedPlanName}, ${tags}, ${description}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);
