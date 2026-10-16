import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/spare-part-status/$id')({
  component: SparePartStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SparePartStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="spare_part_status" recordId={id} />;
}
