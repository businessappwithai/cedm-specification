import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/usage-record-status/$id')({
  component: UsageRecordStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function UsageRecordStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="usage_record_status" recordId={id} />;
}
