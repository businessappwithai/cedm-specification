import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/corrective-action/$id')({
  component: CorrectiveActionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CorrectiveActionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="corrective_action" recordId={id} />;
}
