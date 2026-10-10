import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/fee-status/$id')({
  component: FeeStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FeeStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="fee_status" recordId={id} />;
}
