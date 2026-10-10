import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/assessment-assessment-type/$id')({
  component: AssessmentAssessmentTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssessmentAssessmentTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="assessment_assessment_type" recordId={id} />;
}
