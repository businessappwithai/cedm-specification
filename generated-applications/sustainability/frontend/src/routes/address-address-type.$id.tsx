import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/address-address-type/$id')({
  component: AddressAddressTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AddressAddressTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="address_address_type" recordId={id} />;
}
