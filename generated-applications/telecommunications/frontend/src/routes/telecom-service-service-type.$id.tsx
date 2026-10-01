import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/telecom-service-service-type/$id')({
  component: TelecomServiceServiceTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TelecomServiceServiceTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="telecom_service_service_type" recordId={id} />;
}
