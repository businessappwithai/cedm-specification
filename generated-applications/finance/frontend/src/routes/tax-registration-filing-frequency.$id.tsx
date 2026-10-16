import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/tax-registration-filing-frequency/$id')({
  component: TaxRegistrationFilingFrequencyDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaxRegistrationFilingFrequencyDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="tax_registration_filing_frequency" recordId={id} />;
}
