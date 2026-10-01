import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-performance-assessment-status/$id')({
  component: SupplierPerformanceAssessmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierPerformanceAssessmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_performance_assessment_status" recordId={id} />;
}
