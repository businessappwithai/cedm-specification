import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/quality-characteristic/$id')({
  component: QualityCharacteristicDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function QualityCharacteristicDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="quality_characteristic" recordId={id} />;
}
