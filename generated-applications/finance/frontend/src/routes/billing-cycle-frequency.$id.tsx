import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/billing-cycle-frequency/$id')({
  component: BillingCycleFrequencyDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BillingCycleFrequencyDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="billing_cycle_frequency" recordId={id} />;
}
