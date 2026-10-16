import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/team-team-type/$id')({
  component: TeamTeamTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TeamTeamTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="team_team_type" recordId={id} />;
}
