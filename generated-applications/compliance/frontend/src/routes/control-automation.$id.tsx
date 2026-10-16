import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/control-automation/$id')({
  component: ControlAutomationDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ControlAutomationDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="control_automation" recordId={id} />;
}
