import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-supplier-type/$id')({
  component: SupplierSupplierTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierSupplierTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_supplier_type" recordId={id} />;
}
