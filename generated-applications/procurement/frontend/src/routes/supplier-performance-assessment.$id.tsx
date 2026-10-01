import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-performance-assessment/$id')({
  component: SupplierPerformanceAssessmentDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierPerformanceAssessmentDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_performance_assessment" recordId={id} />;
}
