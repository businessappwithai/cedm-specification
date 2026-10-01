import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/insurance-claim/$id')({
  component: InsuranceClaimDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InsuranceClaimDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="insurance_claim" recordId={id} />;
}
