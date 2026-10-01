import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/return-disposition-status/$id')({
  component: ReturnDispositionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ReturnDispositionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="return_disposition_status" recordId={id} />;
}
