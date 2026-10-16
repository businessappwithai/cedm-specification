import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/variance-comparison-type/$id')({
  component: VarianceComparisonTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function VarianceComparisonTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="variance_comparison_type" recordId={id} />;
}
