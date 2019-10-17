import { default as proto } from '../../src/proto';
import { runReplacers, SIMPLIFY_REPLACERS } from '../../src/serde';

import { string, simplifiedString, tuple, simplifiedTuple } from './native';

import {
  Message,
  Operation,
  ObjectMessage,
  ObjectRequestMessage,
  IsNoneMessage,
  GetShapeMessage,
  ForceObjectDeleteMessage,
  SearchMessage,
  PlanCommandMessage,
  CODES
} from '../../src/types/message';

// ----- MESSAGE ----- //
// The content doesn't really matter since it's being parsed by Serde anyhow
export const contents = string;
export const simContents = simplifiedString;

// The type doesn't really matter since one doesn't exist for the base class Message
export const type = 0;

export const detailedMessage = new Message(type, contents);
export const simplifiedMessage = runReplacers(
  `(${proto['syft.messaging.message.Message']}, (${type}, ${simContents}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

// ----- OPERATION ----- //
// The message doesn't really matter since it's being parsed by Serde anyhow
export const message = string;
export const simMessage = simplifiedString;

// The returnIds don't really matter since they're just workerId's
export const returnIds = tuple;
export const simReturnIds = simplifiedTuple;

export const detailedOperation = new Operation(message, returnIds);
export const simplifiedOperation = runReplacers(
  `(${proto['syft.messaging.message.Operation']}, (${CODES.CMD}, (${simMessage}, ${simReturnIds})))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

// ----- OBJECT MESSAGE ----- //
export const detailedObjectMessage = new ObjectMessage(contents);
export const simplifiedObjectMessage = runReplacers(
  `(${proto['syft.messaging.message.ObjectMessage']}, (${CODES.OBJ}, ${simContents}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

// ----- OBJECT REQUEST MESSAGE ----- //
export const detailedObjectRequestMessage = new ObjectRequestMessage(contents);
export const simplifiedObjectRequestMessage = runReplacers(
  `(${proto['syft.messaging.message.ObjectRequestMessage']}, (${CODES.OBJ_REQ}, ${simContents}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

// ----- IS NONE MESSAGE ----- //
export const detailedIsNoneMessage = new IsNoneMessage(contents);
export const simplifiedIsNoneMessage = runReplacers(
  `(${proto['syft.messaging.message.IsNoneMessage']}, (${CODES.IS_NONE}, ${simContents}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

// ----- GET SHAPE MESSAGE ----- //
export const detailedGetShapeMessage = new GetShapeMessage(contents);
export const simplifiedGetShapeMessage = runReplacers(
  `(${proto['syft.messaging.message.GetShapeMessage']}, (${CODES.GET_SHAPE}, ${simContents}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

// ----- FORCE OBJECT DELETE MESSAGE ----- //
export const detailedForceObjectDeleteMessage = new ForceObjectDeleteMessage(contents); // prettier-ignore
export const simplifiedForceObjectDeleteMessage = runReplacers(
  `(${proto['syft.messaging.message.ForceObjectDeleteMessage']}, (${CODES.FORCE_OBJ_DEL}, ${simContents}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

// ----- SEARCH MESSAGE ----- //
export const detailedSearchMessage = new SearchMessage(contents);
export const simplifiedSearchMessage = runReplacers(
  `(${proto['syft.messaging.message.SearchMessage']}, (${CODES.SEARCH}, ${simContents}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

// ----- PLAN COMMAND MESSAGE ----- //
// The commandName doesn't really matter since it's being parsed by Serde anyhow
export const commandName = string;
export const simCommandName = simplifiedString;

export const detailedPlanCommandMessage = new PlanCommandMessage(commandName, message); // prettier-ignore
export const simplifiedPlanCommandMessage = runReplacers(
  `(${proto['syft.messaging.message.PlanCommandMessage']}, (${CODES.PLAN_CMD}, (${simCommandName}, ${simMessage})))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);
