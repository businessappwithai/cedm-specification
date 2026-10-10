import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/vessel-status/$id')({
  component: VesselStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function VesselStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="vessel_status" recordId={id} />;
}
