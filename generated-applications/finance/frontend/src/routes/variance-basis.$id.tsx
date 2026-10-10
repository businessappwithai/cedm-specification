import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/variance-basis/$id')({
  component: VarianceBasisDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function VarianceBasisDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="variance_basis" recordId={id} />;
}
