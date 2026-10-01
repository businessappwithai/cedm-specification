import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/telecom-service-status/$id')({
  component: TelecomServiceStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TelecomServiceStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="telecom_service_status" recordId={id} />;
}
