import {createHash} from 'node:crypto';
import {inspect} from './png.mjs';

/** Exact encoded identity implies decoded identity. Decode each new byte stream. */
export function pixelValidator(references) {
  const known = new Map();
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  for (const {bytes, pixelSha256} of references) {
    const inspected = inspect(bytes, true);
    if (inspected.pixelSha256 !== pixelSha256) throw Error('Reference pixels do not match review');
    known.set(hash(bytes), inspected);
  }
  return bytes => {
    const encodedSha256 = hash(bytes);
    const previous = known.get(encodedSha256);
    const inspected = previous ?? inspect(bytes, false);
    if (!previous) known.set(encodedSha256, inspected);
    return {...inspected, encodedSha256, validation: previous ? 'exact-encoded-match' : 'decoded'};
  };
}
