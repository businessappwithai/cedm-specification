import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/guardian-relationship-type/$id')({
  component: GuardianRelationshipTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function GuardianRelationshipTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="guardian_relationship_type" recordId={id} />;
}
