import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/assay-status/$id')({
  component: AssayStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AssayStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="assay_status" recordId={id} />;
}
