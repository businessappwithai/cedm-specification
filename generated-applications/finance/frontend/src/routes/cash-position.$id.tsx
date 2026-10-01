import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/cash-position/$id')({
  component: CashPositionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CashPositionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="cash_position" recordId={id} />;
}
