/*
 * Protected Firebase schema paths.
 *
 * Logical collection/table names are never written to Firebase. They are
 * represented by deterministic HMAC-SHA-256 identifiers derived from the
 * same application secret used by encryption.js. Record values remain
 * AES-256-GCM encrypted by encryptDeep/decryptDeep.
 *
 * The fallback secret is intentionally mirrored here so path resolution can
 * be synchronous (Firebase ref() requires a path immediately). If a trusted
 * runtime secret is supplied, deploy a matching generated TABLE_MAP for that
 * secret; the shipped fallback remains the default client deployment mode.
 */
const TABLE_MAP = Object.freeze({
  banquet: '-1RJlMBP8o_TSmTIDV14UQGgXYVSerDIxCv1TVpPh0g',
  hall: '3CiO5mFKAm4G-qQhAsa2r-Fi0we6LEPgNBEiXJkR3AM',
  user: 'pg2bns58xALZ30x4g_tqJTi4LLIyniMO0GpiUYufZIE',
  data: 'RD60GPg4mzM2hYOwVob3K6yIe3KD-35K5h83n-MuNwE',
  redmarkdates: 'rj4ZhDszZRHaTS85chgJWFEAnf26BdcIbWERbiypQog',
});

const CHILD_MAP = Object.freeze({
  'unique_bank': 'wIRKWzf6wvNjeT5pOX7nmmumrXaqzmUSgLNW2ndK8XM',
  'unique_hall': 'AHgOlzhCZL8fIZQUxhKbnhDVntWKKS61wK1d2IuHtP4',
  'unique_user': 'WJkOXuzBKWFZ9rxG9a6_0yxfo5g7IwbnZZdZBRZlmRw',
  'twostepauthkey': '4p-vWOZBhsx68oggziu2gqEBVcGvARuZHnRG1j85DQg',
  'currentid': 'UgAz06MDRsh6ic1gHew5p9g2RgJAXcytEFAfMYUY_SA',
  'unique_redmark': 'Pa1xe5Mo3aIpCYV0LAYmh6Hd7l3fYbA1u-PLIdk2T3c',
});

export function secureDbPath(logicalPath) {
  let p = String(logicalPath ?? '').trim();
  if (!p) return p;
  const leading = p.startsWith('/') ? '/' : '';
  p = p.replace(/^\/+/, '');
  const parts = p.split('/').filter(Boolean);
  if (!parts.length) return leading || '/';
  if (TABLE_MAP[parts[0]]) parts[0] = TABLE_MAP[parts[0]];
  if (parts.length > 1 && CHILD_MAP[parts[1]]) parts[1] = CHILD_MAP[parts[1]];
  return `${leading}${parts.join('/')}`;
}

export function isProtectedDbPath(path) {
  const p = String(path ?? '').replace(/^\/+/, '');
  const first = p.split('/')[0];
  return Object.values(TABLE_MAP).includes(first);
}
