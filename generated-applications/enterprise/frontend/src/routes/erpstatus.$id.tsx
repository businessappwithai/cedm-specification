import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/erpstatus/$id')({
  component: ERPStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ERPStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="erp_status" recordId={id} />;
}
