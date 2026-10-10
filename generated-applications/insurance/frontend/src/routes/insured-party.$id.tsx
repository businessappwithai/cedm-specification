import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/insured-party/$id')({
  component: InsuredPartyDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InsuredPartyDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="insured_party" recordId={id} />;
}
