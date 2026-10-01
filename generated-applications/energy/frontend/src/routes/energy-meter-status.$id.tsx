import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/energy-meter-status/$id')({
  component: EnergyMeterStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EnergyMeterStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="energy_meter_status" recordId={id} />;
}
