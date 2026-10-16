import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/control-effectiveness/$id')({
  component: ControlEffectivenessDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ControlEffectivenessDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="control_effectiveness" recordId={id} />;
}
