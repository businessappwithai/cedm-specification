import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/legal-case-status/$id')({
  component: LegalCaseStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LegalCaseStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="legal_case_status" recordId={id} />;
}
