import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/return-disposition-disposition-code/$id')({
  component: ReturnDispositionDispositionCodeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ReturnDispositionDispositionCodeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="return_disposition_disposition_code" recordId={id} />;
}
