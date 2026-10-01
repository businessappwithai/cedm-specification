import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/asset-depreciation/$id')({
  component: AssetDepreciationDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssetDepreciationDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="asset_depreciation" recordId={id} />;
}
