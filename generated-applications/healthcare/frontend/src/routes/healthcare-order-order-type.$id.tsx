import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/healthcare-order-order-type/$id')({
  component: HealthcareOrderOrderTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function HealthcareOrderOrderTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="healthcare_order_order_type" recordId={id} />;
}
