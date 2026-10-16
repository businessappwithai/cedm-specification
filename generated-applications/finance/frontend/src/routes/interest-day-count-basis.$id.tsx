import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/interest-day-count-basis/$id')({
  component: InterestDayCountBasisDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InterestDayCountBasisDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="interest_day_count_basis" recordId={id} />;
}
