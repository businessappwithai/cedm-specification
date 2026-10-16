import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/team-status/$id')({
  component: TeamStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TeamStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="team_status" recordId={id} />;
}
