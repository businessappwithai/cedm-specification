import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/material-issue/$id')({
  component: MaterialIssueDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MaterialIssueDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="material_issue" recordId={id} />;
}
