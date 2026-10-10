import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/claim-line/$id')({
  component: ClaimLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ClaimLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="claim_line" recordId={id} />;
}
