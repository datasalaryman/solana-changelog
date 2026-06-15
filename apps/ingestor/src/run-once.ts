import { Client, Connection } from '@temporalio/client'
import { randomUUID } from 'node:crypto'
import { getTemporalConnectionOptions, getTemporalNamespace, TASK_QUEUE } from './config'
import { syncRepositoriesWorkflow } from './workflows'

async function run() {
  const connection = await Connection.connect(getTemporalConnectionOptions())
  const client = new Client({ connection, namespace: getTemporalNamespace() })
  const result = await client.workflow.execute(syncRepositoriesWorkflow, {
    taskQueue: TASK_QUEUE,
    workflowId: `solana-changelog-ingestor-${randomUUID()}`,
  })

  console.log(JSON.stringify(result, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
