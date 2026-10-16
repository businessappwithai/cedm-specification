import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/equipment-operating-status/$id')({
  component: EquipmentOperatingStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EquipmentOperatingStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="equipment_operating_status" recordId={id} />;
}
