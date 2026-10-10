import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/protocol/$id')({
  component: ProtocolDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProtocolDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="protocol" recordId={id} />;
}
