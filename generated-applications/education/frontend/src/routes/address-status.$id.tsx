import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/address-status/$id')({
  component: AddressStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AddressStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="address_status" recordId={id} />;
}
