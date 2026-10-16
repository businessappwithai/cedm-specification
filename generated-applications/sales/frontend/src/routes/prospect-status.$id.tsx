import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/prospect-status/$id')({
  component: ProspectStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProspectStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="prospect_status" recordId={id} />;
}
