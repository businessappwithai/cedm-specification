import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/business-process-status/$id')({
  component: BusinessProcessStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BusinessProcessStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="business_process_status" recordId={id} />;
}
