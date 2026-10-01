import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/bomcomponent/$id')({
  component: BOMComponentDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BOMComponentDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="bom_component" recordId={id} />;
}
