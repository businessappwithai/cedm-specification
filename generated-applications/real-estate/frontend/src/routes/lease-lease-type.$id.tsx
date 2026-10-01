import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/lease-lease-type/$id')({
  component: LeaseLeaseTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LeaseLeaseTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="lease_lease_type" recordId={id} />;
}
