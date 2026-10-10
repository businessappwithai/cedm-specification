import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/guardian-status/$id')({
  component: GuardianStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function GuardianStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="guardian_status" recordId={id} />;
}
