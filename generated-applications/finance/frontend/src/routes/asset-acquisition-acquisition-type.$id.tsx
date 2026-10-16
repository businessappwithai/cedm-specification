import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/asset-acquisition-acquisition-type/$id')({
  component: AssetAcquisitionAcquisitionTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssetAcquisitionAcquisitionTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="asset_acquisition_acquisition_type" recordId={id} />;
}
