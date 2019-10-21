import { default as proto } from '../../src/proto';

import Protocol from '../../src/types/protocol';
import { runReplacers, SIMPLIFY_REPLACERS } from '../../src/serde';
import { List, Tuple } from '../../src/types/native';

export const id = 18797824900;
export const tags = null;
export const description = null;
export const plans = new List(
  new Tuple('assignment1', 37163364537),
  new Tuple('assignment2', 70249651082),
  new Tuple('assignment3', 81654059278)
);
export const workersResolved = false;

export const simplifiedPlans = `
(1,
   ((6, ((5, (b'assignment1',)), 37163364537)),
    (6, ((5, (b'assignment2',)), 70249651082)),
    (6, ((5, (b'assignment3',)), 81654059278))))
`;

export const detailedProtocol = new Protocol(id, tags, description, plans, workersResolved); // prettier-ignore

export const simplifiedProtocol = runReplacers(
  `(${proto['syft.messaging.protocol.Protocol']}, (${id}, ${tags}, ${description}, ${simplifiedPlans}, ${workersResolved}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);
