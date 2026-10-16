import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/asset-acquisition-status/$id')({
  component: AssetAcquisitionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssetAcquisitionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="asset_acquisition_status" recordId={id} />;
}
