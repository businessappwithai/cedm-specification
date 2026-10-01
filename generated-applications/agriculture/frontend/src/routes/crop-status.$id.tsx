import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/crop-status/$id')({
  component: CropStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CropStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="crop_status" recordId={id} />;
}
