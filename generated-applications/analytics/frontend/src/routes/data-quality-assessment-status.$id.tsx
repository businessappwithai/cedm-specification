import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/data-quality-assessment-status/$id')({
  component: DataQualityAssessmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DataQualityAssessmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="data_quality_assessment_status" recordId={id} />;
}
