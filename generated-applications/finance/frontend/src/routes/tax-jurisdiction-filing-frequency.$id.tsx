import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/tax-jurisdiction-filing-frequency/$id')({
  component: TaxJurisdictionFilingFrequencyDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaxJurisdictionFilingFrequencyDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="tax_jurisdiction_filing_frequency" recordId={id} />;
}
