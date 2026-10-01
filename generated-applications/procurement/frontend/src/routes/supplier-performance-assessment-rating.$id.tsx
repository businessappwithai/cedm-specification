import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-performance-assessment-rating/$id')({
  component: SupplierPerformanceAssessmentRatingDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierPerformanceAssessmentRatingDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_performance_assessment_rating" recordId={id} />;
}
