import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/unit-of-measure-category/$id')({
  component: UnitOfMeasureCategoryDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function UnitOfMeasureCategoryDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="unit_of_measure_category" recordId={id} />;
}
