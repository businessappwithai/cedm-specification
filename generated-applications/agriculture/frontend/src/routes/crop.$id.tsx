import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/crop/$id')({
  component: CropDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CropDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="crop" recordId={id} />;
}
