import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/legal-case/$id')({
  component: LegalCaseDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LegalCaseDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="legal_case" recordId={id} />;
}
