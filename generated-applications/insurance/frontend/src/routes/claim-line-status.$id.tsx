import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/claim-line-status/$id')({
  component: ClaimLineStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ClaimLineStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="claim_line_status" recordId={id} />;
}
