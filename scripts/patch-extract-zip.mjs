import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const extractZipPath = resolve(__dirname, '..', 'node_modules', 'extract-zip', 'index.js')

try {
  const content = readFileSync(extractZipPath, 'utf-8')
  if (content.includes('pwsh -Command "Expand-Archive')) {
    console.log('extract-zip: già patchato, skip')
    process.exit(0)
  }
} catch {
  console.error('extract-zip: file non trovato in node_modules')
  process.exit(1)
}

const patch = `const debug = require('debug')('extract-zip')
const { execSync } = require('child_process')
const { promises: fs } = require('fs')
const path = require('path')

module.exports = async function (zipPath, opts) {
  debug('creating target directory', opts.dir)

  if (!path.isAbsolute(opts.dir)) {
    throw new Error('Target directory is expected to be absolute')
  }

  await fs.mkdir(opts.dir, { recursive: true })
  opts.dir = await fs.realpath(opts.dir)

  debug('extracting', zipPath, 'to', opts.dir)

  const psCmd = \`Expand-Archive -Path '\${zipPath}' -DestinationPath '\${opts.dir}' -Force\`
  execSync(\`pwsh -Command "\${psCmd}"\`, { maxBuffer: 1024 * 1024 * 1024 })

  debug('zip extraction complete')
}`

writeFileSync(extractZipPath, patch, 'utf-8')
console.log('extract-zip: patchato con successo (usa pwsh Expand-Archive)')
