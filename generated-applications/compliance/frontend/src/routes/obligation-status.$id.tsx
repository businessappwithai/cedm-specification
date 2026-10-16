import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/obligation-status/$id')({
  component: ObligationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ObligationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="obligation_status" recordId={id} />;
}
