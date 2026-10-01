import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/request-for-quotation-status/$id')({
  component: RequestForQuotationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RequestForQuotationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="request_for_quotation_status" recordId={id} />;
}
