import { Client, Connection, ScheduleOverlapPolicy } from '@temporalio/client'
import { getTemporalConnectionOptions, getTemporalNamespace, SCHEDULE_ID, SYNC_INTERVAL, TASK_QUEUE } from './config'
import { syncRepositoriesWorkflow } from './workflows'

async function run() {
  const connection = await Connection.connect(getTemporalConnectionOptions())
  const client = new Client({ connection, namespace: getTemporalNamespace() })

  try {
    await client.schedule.create({
      scheduleId: SCHEDULE_ID,
      action: {
        type: 'startWorkflow',
        workflowType: syncRepositoriesWorkflow,
        taskQueue: TASK_QUEUE,
      },
      policies: {
        catchupWindow: '1 day',
        overlap: ScheduleOverlapPolicy.SKIP,
      },
      spec: {
        intervals: [{ every: SYNC_INTERVAL }],
      },
    })
    console.log(`Created Temporal schedule ${SCHEDULE_ID}`)
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      const handle = client.schedule.getHandle(SCHEDULE_ID)
      await handle.update((current) => ({
        ...current,
        action: {
          type: 'startWorkflow',
          workflowType: syncRepositoriesWorkflow,
          taskQueue: TASK_QUEUE,
        },
        policies: {
          catchupWindow: '1 day',
          overlap: ScheduleOverlapPolicy.SKIP,
        },
        spec: {
          intervals: [{ every: SYNC_INTERVAL }],
        },
      }))
      console.log(`Updated Temporal schedule ${SCHEDULE_ID}`)
      return
    }

    throw error
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
