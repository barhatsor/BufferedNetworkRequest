import { defineConfig, type UserConfig } from 'tsdown'

function getDemoConfig(demoDir: string): UserConfig {
  return {
    entry: `${demoDir}/index.ts`,
    outDir: `${demoDir}/build`,
    format: 'esm',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: true,
    deps: { neverBundle: ['bufferednetworkrequest'] }
  }
}

export default defineConfig([
  getDemoConfig('basic-demo'),
  getDemoConfig('bench')
])
