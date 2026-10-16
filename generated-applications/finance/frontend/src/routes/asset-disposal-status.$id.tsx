import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/asset-disposal-status/$id')({
  component: AssetDisposalStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssetDisposalStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="asset_disposal_status" recordId={id} />;
}
