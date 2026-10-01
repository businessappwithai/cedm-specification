import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/brand/$id')({
  component: BrandDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BrandDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="brand" recordId={id} />;
}
