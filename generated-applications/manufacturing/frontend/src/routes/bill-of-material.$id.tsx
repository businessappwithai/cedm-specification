import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/bill-of-material/$id')({
  component: BillOfMaterialDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BillOfMaterialDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="bill_of_material" recordId={id} />;
}
