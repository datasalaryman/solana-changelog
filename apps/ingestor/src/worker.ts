import { NativeConnection, Worker } from '@temporalio/worker'
import { activities } from './activities'
import { getTemporalConnectionOptions, getTemporalNamespace, TASK_QUEUE } from './config'

async function run() {
  const connection = await NativeConnection.connect(getTemporalConnectionOptions())
  const worker = await Worker.create({
    connection,
    namespace: getTemporalNamespace(),
    taskQueue: TASK_QUEUE,
    workflowsPath: new URL('./workflows.ts', import.meta.url).pathname,
    activities,
  })

  await worker.run()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
