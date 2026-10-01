import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/healthcare-patient-status/$id')({
  component: HealthcarePatientStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function HealthcarePatientStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="healthcare_patient_status" recordId={id} />;
}
