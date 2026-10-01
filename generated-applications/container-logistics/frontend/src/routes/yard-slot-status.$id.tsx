import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/yard-slot-status/$id')({
  component: YardSlotStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function YardSlotStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="yard_slot_status" recordId={id} />;
}
