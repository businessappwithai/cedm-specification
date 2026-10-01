import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/insurance-claim-status/$id')({
  component: InsuranceClaimStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InsuranceClaimStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="insurance_claim_status" recordId={id} />;
}
