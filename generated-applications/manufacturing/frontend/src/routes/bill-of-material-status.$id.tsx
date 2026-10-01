import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/bill-of-material-status/$id')({
  component: BillOfMaterialStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BillOfMaterialStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="bill_of_material_status" recordId={id} />;
}
