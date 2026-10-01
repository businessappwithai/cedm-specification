import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/product-category/$id')({
  component: ProductCategoryDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProductCategoryDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="product_category" recordId={id} />;
}
