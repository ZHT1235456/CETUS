import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const targetDir = join(root, 'src-tauri', 'target')
const env = { ...process.env, CARGO_TARGET_DIR: targetDir }

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const node = process.execPath

function run(command, args, runEnv = env) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: runEnv,
    stdio: 'inherit',
    shell: false,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(npx, ['tauri', 'build'])
run(node, [join(dirname(fileURLToPath(import.meta.url)), 'collect-release.mjs')], env)
