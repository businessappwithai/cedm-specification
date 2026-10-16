import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/allergy-severity/$id')({
  component: AllergySeverityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AllergySeverityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="allergy_severity" recordId={id} />;
}
