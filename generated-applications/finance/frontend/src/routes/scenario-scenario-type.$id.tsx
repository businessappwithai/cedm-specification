import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/scenario-scenario-type/$id')({
  component: ScenarioScenarioTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ScenarioScenarioTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="scenario_scenario_type" recordId={id} />;
}
