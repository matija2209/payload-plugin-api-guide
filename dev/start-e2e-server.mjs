import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { spawn } from 'node:child_process'
import process from 'node:process'

const port = process.argv[2] || '3100'

const replSet = await MongoMemoryReplSet.create({
  replSet: {
    count: 1,
    dbName: 'payloadmemory',
  },
})

const child = spawn(
  'npx',
  ['next', 'dev', 'dev', '--turbo', '--port', port],
  {
    env: {
      ...process.env,
      DATABASE_URL: `${replSet.getUri()}&retryWrites=true`,
    },
    stdio: 'inherit',
  },
)

const shutdown = async (signal) => {
  child.kill(signal)
  await replSet.stop()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})

child.on('exit', async (code) => {
  await replSet.stop()
  process.exit(code ?? 0)
})
