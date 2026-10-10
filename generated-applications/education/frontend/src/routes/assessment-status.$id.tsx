import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/assessment-status/$id')({
  component: AssessmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssessmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="assessment_status" recordId={id} />;
}
