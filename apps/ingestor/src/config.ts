import './loadEnv'

export const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'solana-changelog-ingestor'
export const SCHEDULE_ID = process.env.TEMPORAL_SCHEDULE_ID || 'solana-changelog-ingestor'
export const SYNC_INTERVAL = process.env.SYNC_INTERVAL || '1 hour'

export function getTemporalConnectionOptions() {
  return {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  }
}

export function getTemporalNamespace() {
  return process.env.TEMPORAL_NAMESPACE || 'default'
}
