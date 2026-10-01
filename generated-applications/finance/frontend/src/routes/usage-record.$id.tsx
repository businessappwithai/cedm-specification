import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/usage-record/$id')({
  component: UsageRecordDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function UsageRecordDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="usage_record" recordId={id} />;
}
