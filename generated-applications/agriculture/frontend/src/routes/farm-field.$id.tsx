import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/farm-field/$id')({
  component: FarmFieldDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FarmFieldDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="farm_field" recordId={id} />;
}
