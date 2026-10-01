import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/data-quality-assessment/$id')({
  component: DataQualityAssessmentDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DataQualityAssessmentDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="data_quality_assessment" recordId={id} />;
}
