import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  DEFAULT_GATE_CONFIG,
  normalizeGateConfig,
  type TraceGateConfig,
} from '@nexus-engineering/shared'

const CONFIG_DIR = '.nexus'
const CONFIG_FILE = 'trace-gate.json'

function configPath(): string {
  return join(process.cwd(), CONFIG_DIR, CONFIG_FILE)
}

/**
 * Load the persisted gate config merged on top of defaults. Never throws — a
 * missing or malformed file falls back to the default policy so the gate stays
 * operational (fail-safe).
 */
export function getGateConfig(): TraceGateConfig {
  try {
    const path = configPath()
    if (!existsSync(path)) return { ...DEFAULT_GATE_CONFIG }
    return normalizeGateConfig(JSON.parse(readFileSync(path, 'utf-8')))
  } catch {
    return { ...DEFAULT_GATE_CONFIG }
  }
}

/**
 * Persist a (partial) gate config, normalizing every field. Returns the stored
 * config. Persistence failures are non-fatal (fail-safe): the normalized config
 * is still returned.
 */
export function putGateConfig(input: Partial<TraceGateConfig>): TraceGateConfig {
  const config = normalizeGateConfig(input)
  try {
    const dir = join(process.cwd(), CONFIG_DIR)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(configPath(), JSON.stringify(config, null, 2) + '\n', 'utf-8')
  } catch {
    // Non-fatal: the gate can still run with the in-memory normalized config.
  }
  return config
}
