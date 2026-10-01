import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/quotation-status/$id')({
  component: QuotationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function QuotationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="quotation_status" recordId={id} />;
}
