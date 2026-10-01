import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/quality-measurement/$id')({
  component: QualityMeasurementDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function QualityMeasurementDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="quality_measurement" recordId={id} />;
}
