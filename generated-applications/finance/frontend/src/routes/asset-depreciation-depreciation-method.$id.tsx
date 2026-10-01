import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/asset-depreciation-depreciation-method/$id')({
  component: AssetDepreciationDepreciationMethodDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssetDepreciationDepreciationMethodDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="asset_depreciation_depreciation_method" recordId={id} />;
}
