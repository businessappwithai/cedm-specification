import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/premium-status/$id')({
  component: PremiumStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PremiumStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="premium_status" recordId={id} />;
}
