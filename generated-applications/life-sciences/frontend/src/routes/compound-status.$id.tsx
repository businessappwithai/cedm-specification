import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/compound-status/$id')({
  component: CompoundStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CompoundStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="compound_status" recordId={id} />;
}
