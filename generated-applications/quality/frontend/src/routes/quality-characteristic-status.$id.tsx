import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/quality-characteristic-status/$id')({
  component: QualityCharacteristicStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function QualityCharacteristicStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="quality_characteristic_status" recordId={id} />;
}
