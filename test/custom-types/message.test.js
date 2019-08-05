import { type, contents, detailedMessage } from '../dummy/message';

describe('Message', () => {
  test('can be properly constructed', () => {
    expect(detailedMessage.type).toStrictEqual(type);
    expect(detailedMessage.contents).toStrictEqual(contents);
  });
});
