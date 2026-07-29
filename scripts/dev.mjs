// Runs the server and client dev servers together, prefixing each line of output
// with which process it came from. No extra dependency needed — just Node's
// built-in child_process. Ctrl+C stops both.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const isWindows = process.platform === 'win32'
const npmCmd = isWindows ? 'npm.cmd' : 'npm'

const processes = [
  { name: 'server', color: '\x1b[34m', cwd: path.join(rootDir, 'server') },
  { name: 'client', color: '\x1b[35m', cwd: path.join(rootDir, 'client') },
]

const RESET = '\x1b[0m'
let exiting = false

function prefixedLog(name, color, data) {
  const lines = data.toString().split('\n').filter((line) => line.length > 0)
  for (const line of lines) {
    process.stdout.write(`${color}[${name}]${RESET} ${line}\n`)
  }
}

const children = processes.map(({ name, color, cwd }) => {
  const child = spawn(npmCmd, ['run', 'dev'], { cwd, shell: isWindows })

  child.stdout.on('data', (data) => prefixedLog(name, color, data))
  child.stderr.on('data', (data) => prefixedLog(name, color, data))
  child.on('exit', (code) => {
    if (!exiting) {
      console.log(`${color}[${name}]${RESET} exited with code ${code}`)
    }
  })

  return child
})

function shutdown() {
  exiting = true
  for (const child of children) {
    child.kill()
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown);
