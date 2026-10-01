import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/person-party-type/$id')({
  component: PersonPartyTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PersonPartyTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="person_party_type" recordId={id} />;
}
