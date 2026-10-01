import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/quality-inspection-result/$id')({
  component: QualityInspectionResultDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function QualityInspectionResultDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="quality_inspection_result" recordId={id} />;
}
