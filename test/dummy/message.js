import Message from '../../src/custom-types/message';

export const type = 1;
export const contents = `(9, 53361601662)`;

export const detailedMessage = new Message(type, contents);

export const simplifiedMessage = `(24, (${type}, ${contents}))`;
