import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/identity-identity-type/$id')({
  component: IdentityIdentityTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function IdentityIdentityTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="identity_identity_type" recordId={id} />;
}
