import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/cost-center-category/$id')({
  component: CostCenterCategoryDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CostCenterCategoryDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="cost_center_category" recordId={id} />;
}
