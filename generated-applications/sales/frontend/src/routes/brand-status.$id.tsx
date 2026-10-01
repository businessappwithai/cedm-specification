import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/brand-status/$id')({
  component: BrandStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BrandStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="brand_status" recordId={id} />;
}
