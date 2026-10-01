import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-role-type/$id')({
  component: SupplierRoleTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierRoleTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_role_type" recordId={id} />;
}
