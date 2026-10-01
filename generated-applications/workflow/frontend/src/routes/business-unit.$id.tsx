import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/business-unit/$id')({
  component: BusinessUnitDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BusinessUnitDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="business_unit" recordId={id} />;
}
