import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/lease-status/$id')({
  component: LeaseStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LeaseStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="lease_status" recordId={id} />;
}
