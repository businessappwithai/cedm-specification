import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/signature-status/$id')({
  component: SignatureStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SignatureStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="signature_status" recordId={id} />;
}
