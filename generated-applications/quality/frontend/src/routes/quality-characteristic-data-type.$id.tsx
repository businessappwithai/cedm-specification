import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/quality-characteristic-data-type/$id')({
  component: QualityCharacteristicDataTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function QualityCharacteristicDataTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="quality_characteristic_data_type" recordId={id} />;
}
