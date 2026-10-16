import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/filing-filing-type/$id')({
  component: FilingFilingTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FilingFilingTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="filing_filing_type" recordId={id} />;
}
