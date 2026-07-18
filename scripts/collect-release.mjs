import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const releaseDir = join(root, 'release')
const targetDir = join(
  process.env.CARGO_TARGET_DIR ?? join(root, 'src-tauri', 'target'),
  'release',
)
const productName = 'Cetus'

mkdirSync(releaseDir, { recursive: true })

const copied = []

function copyFile(src, dest) {
  if (!existsSync(src)) return false

  const tmp = `${dest}.tmp`
  cpSync(src, tmp)
  try {
    if (existsSync(dest)) rmSync(dest, { force: true })
    renameSync(tmp, dest)
  } catch (error) {
    rmSync(tmp, { force: true })
    const locked =
      error instanceof Error &&
      'code' in error &&
      (error.code === 'EBUSY' || error.code === 'EPERM' || error.code === 'EACCES')
    if (locked) {
      console.error(`无法覆盖 ${dest}，请先关闭正在运行的 Cetus 程序后重试。`)
    }
    throw error
  }

  copied.push(dest.replace(`${root}\\`, '').replace(`${root}/`, ''))
  return true
}

const mainExe = join(targetDir, 'cetus.exe')
copyFile(mainExe, join(releaseDir, `${productName}.exe`))

for (const sub of ['nsis', 'msi']) {
  const bundleDir = join(targetDir, 'bundle', sub)
  if (!existsSync(bundleDir)) continue
  for (const file of readdirSync(bundleDir)) {
    copyFile(join(bundleDir, file), join(releaseDir, file))
  }
}

if (copied.length === 0) {
  console.error('未找到构建产物，请先运行 tauri build')
  process.exit(1)
}

console.log('已收集到 release/：')
for (const file of copied) console.log(`  ${file}`)
