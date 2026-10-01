import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/test-method-status/$id')({
  component: TestMethodStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TestMethodStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="test_method_status" recordId={id} />;
}
