import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/request-for-quotation/$id')({
  component: RequestForQuotationDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RequestForQuotationDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="request_for_quotation" recordId={id} />;
}
