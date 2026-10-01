import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/yard-block-status/$id')({
  component: YardBlockStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function YardBlockStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="yard_block_status" recordId={id} />;
}
