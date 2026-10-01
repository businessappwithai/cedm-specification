import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/control-frequency/$id')({
  component: ControlFrequencyDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ControlFrequencyDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="control_frequency" recordId={id} />;
}
