import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/packaging-packaging-level/$id')({
  component: PackagingPackagingLevelDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PackagingPackagingLevelDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="packaging_packaging_level" recordId={id} />;
}
