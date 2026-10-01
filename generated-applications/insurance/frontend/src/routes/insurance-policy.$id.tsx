import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/insurance-policy/$id')({
  component: InsurancePolicyDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InsurancePolicyDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="insurance_policy" recordId={id} />;
}
