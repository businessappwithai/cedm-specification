import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/risk/$id')({
  component: RiskDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RiskDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="risk" recordId={id} />;
}
