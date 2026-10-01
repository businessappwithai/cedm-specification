import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/property-status/$id')({
  component: PropertyStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PropertyStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="property_status" recordId={id} />;
}
