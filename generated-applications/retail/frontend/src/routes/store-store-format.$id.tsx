import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/store-store-format/$id')({
  component: StoreStoreFormatDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function StoreStoreFormatDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="store_store_format" recordId={id} />;
}
