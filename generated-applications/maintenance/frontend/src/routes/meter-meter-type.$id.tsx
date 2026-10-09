import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/meter-meter-type/$id')({
  component: MeterMeterTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MeterMeterTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="meter_meter_type" recordId={id} />;
}
