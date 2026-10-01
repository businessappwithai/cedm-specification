import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/party-role-role-type/$id')({
  component: PartyRoleRoleTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PartyRoleRoleTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="party_role_role_type" recordId={id} />;
}
