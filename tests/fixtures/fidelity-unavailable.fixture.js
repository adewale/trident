import { parser } from './pieParser.js';
import { db, MISSING_CONSTANT } from './pieDb.js';
it('caught missing getter cannot pass', async () => {
  await parser.parse('pie\n"A":1');
  expect(() => db.missingNativeGetter()).toThrow();
});
it('unavailable imported value cannot pass a defined assertion', async () => {
  await parser.parse('pie\n"A":1');
  expect(MISSING_CONSTANT).toBeDefined();
});
it.each([1, 2])('duplicate title', async value => {
  await parser.parse('pie\n"A":1');
  expect(db.getSections().get('A')).toBe(value);
});
