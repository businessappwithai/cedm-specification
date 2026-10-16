import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/asset-disposal-disposal-method/$id')({
  component: AssetDisposalDisposalMethodDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssetDisposalDisposalMethodDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="asset_disposal_disposal_method" recordId={id} />;
}
