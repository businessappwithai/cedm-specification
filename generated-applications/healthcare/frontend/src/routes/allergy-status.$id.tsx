import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/allergy-status/$id')({
  component: AllergyStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AllergyStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="allergy_status" recordId={id} />;
}
