import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/employment-employment-type/$id')({
  component: EmploymentEmploymentTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EmploymentEmploymentTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="employment_employment_type" recordId={id} />;
}
