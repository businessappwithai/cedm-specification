import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/approval-status/$id')({
  component: ApprovalStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ApprovalStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="approval_status" recordId={id} />;
}
