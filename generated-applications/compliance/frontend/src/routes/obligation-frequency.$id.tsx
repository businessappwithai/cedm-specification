import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/obligation-frequency/$id')({
  component: ObligationFrequencyDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ObligationFrequencyDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="obligation_frequency" recordId={id} />;
}
