import { existsSync } from 'node:fs'

/** AM_CHROMIUM_EXECUTABLE, then a system Chromium, then Playwright's own browser. */
export const chromiumExecutable = process.env.AM_CHROMIUM_EXECUTABLE ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)
