import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/obligation-obligation-type/$id')({
  component: ObligationObligationTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ObligationObligationTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="obligation_obligation_type" recordId={id} />;
}
