import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/legal-case-our-role/$id')({
  component: LegalCaseOurRoleDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LegalCaseOurRoleDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="legal_case_our_role" recordId={id} />;
}
