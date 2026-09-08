import { randomUUID } from 'node:crypto';
// Unique fixture names must themselves satisfy the production name policy.
export const alphabetic = value => String(value).replace(/[0-9]/g, digit => String.fromCharCode(97 + Number(digit)));
export const fixtureMarker = prefix => `${prefix}-${alphabetic(randomUUID())}`;
