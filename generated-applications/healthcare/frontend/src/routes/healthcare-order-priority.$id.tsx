import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/healthcare-order-priority/$id')({
  component: HealthcareOrderPriorityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function HealthcareOrderPriorityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="healthcare_order_priority" recordId={id} />;
}
