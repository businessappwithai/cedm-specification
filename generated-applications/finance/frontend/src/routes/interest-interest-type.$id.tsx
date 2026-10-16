import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/interest-interest-type/$id')({
  component: InterestInterestTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InterestInterestTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="interest_interest_type" recordId={id} />;
}
