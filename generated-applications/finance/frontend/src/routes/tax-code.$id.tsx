import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/tax-code/$id')({
  component: TaxCodeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaxCodeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="tax_code" recordId={id} />;
}
