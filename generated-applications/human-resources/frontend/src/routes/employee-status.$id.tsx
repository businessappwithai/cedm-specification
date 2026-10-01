import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/employee-status/$id')({
  component: EmployeeStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EmployeeStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="employee_status" recordId={id} />;
}
