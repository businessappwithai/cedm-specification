import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/lot-status/$id')({
  component: LotStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LotStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="lot_status" recordId={id} />;
}
