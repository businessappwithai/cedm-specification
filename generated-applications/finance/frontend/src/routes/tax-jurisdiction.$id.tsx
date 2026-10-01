import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/tax-jurisdiction/$id')({
  component: TaxJurisdictionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaxJurisdictionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="tax_jurisdiction" recordId={id} />;
}
