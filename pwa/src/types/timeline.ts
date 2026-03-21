// Auto-mirrored from packages/shared-schema/TimelineEvent.schema.json
export interface TimelineEvent {
  eventId: string
  date: string       // ISO8601
  eraLabel: string
  title: string
  summary: string
  relatedSnapshotId: string | null
  sourceIds: string[]
}
