import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/production-record-status/$id')({
  component: ProductionRecordStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProductionRecordStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="production_record_status" recordId={id} />;
}
