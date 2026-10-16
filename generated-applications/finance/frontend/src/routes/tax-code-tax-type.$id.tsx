import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/tax-code-tax-type/$id')({
  component: TaxCodeTaxTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaxCodeTaxTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="tax_code_tax_type" recordId={id} />;
}
