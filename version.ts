import manifest from './package.json' with { type: 'json' }
/** Source CLI and compiled kit share one release version. */
export const TRIDENT_VERSION = manifest.version
