import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/asset-class-status/$id')({
  component: AssetClassStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssetClassStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="asset_class_status" recordId={id} />;
}
