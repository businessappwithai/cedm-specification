import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/asset-transfer-status/$id')({
  component: AssetTransferStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssetTransferStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="asset_transfer_status" recordId={id} />;
}
