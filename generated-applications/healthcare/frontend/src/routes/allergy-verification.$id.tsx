import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/allergy-verification/$id')({
  component: AllergyVerificationDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AllergyVerificationDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="allergy_verification" recordId={id} />;
}
