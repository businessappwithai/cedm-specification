import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/diagnosis-diagnosis-type/$id')({
  component: DiagnosisDiagnosisTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DiagnosisDiagnosisTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="diagnosis_diagnosis_type" recordId={id} />;
}
