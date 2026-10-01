import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/shopping-cart-line/$id')({
  component: ShoppingCartLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ShoppingCartLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="shopping_cart_line" recordId={id} />;
}
