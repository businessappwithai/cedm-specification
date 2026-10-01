import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/medication-status/$id')({
  component: MedicationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MedicationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="medication_status" recordId={id} />;
}
