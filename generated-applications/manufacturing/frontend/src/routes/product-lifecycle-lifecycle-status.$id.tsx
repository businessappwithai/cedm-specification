import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/product-lifecycle-lifecycle-status/$id')({
  component: ProductLifecycleLifecycleStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProductLifecycleLifecycleStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="product_lifecycle_lifecycle_status" recordId={id} />;
}
