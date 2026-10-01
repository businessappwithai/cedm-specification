import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/request-for-quotation-line/$id')({
  component: RequestForQuotationLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RequestForQuotationLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="request_for_quotation_line" recordId={id} />;
}
