import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/vehicle-vehicle-type/$id')({
  component: VehicleVehicleTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function VehicleVehicleTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="vehicle_vehicle_type" recordId={id} />;
}
