import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/quotation-line/$id')({
  component: QuotationLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function QuotationLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="quotation_line" recordId={id} />;
}
