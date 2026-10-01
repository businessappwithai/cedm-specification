import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/purchase-requisition-status/$id')({
  component: PurchaseRequisitionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PurchaseRequisitionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="purchase_requisition_status" recordId={id} />;
}
