import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/quality-inspection/$id')({
  component: QualityInspectionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function QualityInspectionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="quality_inspection" recordId={id} />;
}
