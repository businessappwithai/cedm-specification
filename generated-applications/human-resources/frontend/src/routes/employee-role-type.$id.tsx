import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/employee-role-type/$id')({
  component: EmployeeRoleTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EmployeeRoleTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="employee_role_type" recordId={id} />;
}
