import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/scenario-status/$id')({
  component: ScenarioStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ScenarioStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="scenario_status" recordId={id} />;
}
