import { existsSync } from 'node:fs'

/** TRIDENT_CHROMIUM_EXECUTABLE, then a system Chromium, then Playwright's own browser. */
export const chromiumExecutable = process.env.TRIDENT_CHROMIUM_EXECUTABLE ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)
