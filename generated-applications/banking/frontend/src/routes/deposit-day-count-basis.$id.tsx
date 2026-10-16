import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/deposit-day-count-basis/$id')({
  component: DepositDayCountBasisDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DepositDayCountBasisDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="deposit_day_count_basis" recordId={id} />;
}
