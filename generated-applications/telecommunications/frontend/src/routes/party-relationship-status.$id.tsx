import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/party-relationship-status/$id')({
  component: PartyRelationshipStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PartyRelationshipStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="party_relationship_status" recordId={id} />;
}
