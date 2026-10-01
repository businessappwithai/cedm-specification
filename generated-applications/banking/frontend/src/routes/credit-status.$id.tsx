import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/credit-status/$id')({
  component: CreditStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CreditStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="credit_status" recordId={id} />;
}
