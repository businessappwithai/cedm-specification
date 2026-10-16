import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/employment-pay-basis/$id')({
  component: EmploymentPayBasisDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EmploymentPayBasisDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="employment_pay_basis" recordId={id} />;
}
