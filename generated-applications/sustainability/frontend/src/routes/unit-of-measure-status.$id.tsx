import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/unit-of-measure-status/$id')({
  component: UnitOfMeasureStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function UnitOfMeasureStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="unit_of_measure_status" recordId={id} />;
}
