import { defineConfig } from 'tsdown'

const banner = `
/**
 * BufferedNetworkRequest
 * @license MIT
 */
`.trim()

export default defineConfig([
  {
    entry: 'src/index.ts',
    sourcemap: true,
    dts: true,
    clean: true,
    platform: 'neutral',
    banner: banner
  },
  {
    entry: 'src/index.ts',
    minify: true,
    sourcemap: true,
    dts: false,
    clean: false,
    outExtensions: () => ({ js: '.min.js' }),
    platform: 'neutral',
    banner: banner
  }
])
