import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/food-batch-status/$id')({
  component: FoodBatchStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FoodBatchStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="food_batch_status" recordId={id} />;
}
