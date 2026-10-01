import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/healthcare-encounter-status/$id')({
  component: HealthcareEncounterStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function HealthcareEncounterStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="healthcare_encounter_status" recordId={id} />;
}
