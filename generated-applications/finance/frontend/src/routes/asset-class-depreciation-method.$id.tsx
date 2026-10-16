import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/asset-class-depreciation-method/$id')({
  component: AssetClassDepreciationMethodDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssetClassDepreciationMethodDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="asset_class_depreciation_method" recordId={id} />;
}
