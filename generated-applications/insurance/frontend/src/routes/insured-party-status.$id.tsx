import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/insured-party-status/$id')({
  component: InsuredPartyStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InsuredPartyStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="insured_party_status" recordId={id} />;
}
