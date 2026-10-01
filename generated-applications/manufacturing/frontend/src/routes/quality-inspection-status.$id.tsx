import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/quality-inspection-status/$id')({
  component: QualityInspectionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function QualityInspectionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="quality_inspection_status" recordId={id} />;
}
