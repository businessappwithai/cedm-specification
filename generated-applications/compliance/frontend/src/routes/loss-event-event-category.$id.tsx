import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/loss-event-event-category/$id')({
  component: LossEventEventCategoryDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LossEventEventCategoryDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="loss_event_event_category" recordId={id} />;
}
