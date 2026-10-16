import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/legal-case-forum-type/$id')({
  component: LegalCaseForumTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LegalCaseForumTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="legal_case_forum_type" recordId={id} />;
}
