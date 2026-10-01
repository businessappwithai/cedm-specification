import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/handling-unit-type/$id')({
  component: HandlingUnitTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function HandlingUnitTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="handling_unit_type" recordId={id} />;
}
