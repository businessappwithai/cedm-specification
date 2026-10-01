import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/spare-part-criticality/$id')({
  component: SparePartCriticalityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SparePartCriticalityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="spare_part_criticality" recordId={id} />;
}
