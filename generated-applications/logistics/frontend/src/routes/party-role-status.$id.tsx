import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/party-role-status/$id')({
  component: PartyRoleStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PartyRoleStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="party_role_status" recordId={id} />;
}
