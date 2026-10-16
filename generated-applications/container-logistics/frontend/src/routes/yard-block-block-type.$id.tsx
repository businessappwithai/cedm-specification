import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/yard-block-block-type/$id')({
  component: YardBlockBlockTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function YardBlockBlockTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="yard_block_block_type" recordId={id} />;
}
