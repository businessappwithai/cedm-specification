import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/signature-method/$id')({
  component: SignatureMethodDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SignatureMethodDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="signature_method" recordId={id} />;
}
