import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/lease/$id')({
  component: LeaseDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LeaseDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="lease" recordId={id} />;
}
