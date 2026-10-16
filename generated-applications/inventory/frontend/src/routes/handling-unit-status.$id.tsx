import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/handling-unit-status/$id')({
  component: HandlingUnitStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function HandlingUnitStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="handling_unit_status" recordId={id} />;
}
