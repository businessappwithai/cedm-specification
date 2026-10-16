import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/material-issue-issue-type/$id')({
  component: MaterialIssueIssueTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MaterialIssueIssueTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="material_issue_issue_type" recordId={id} />;
}
