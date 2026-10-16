import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/allergy-allergy-type/$id')({
  component: AllergyAllergyTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AllergyAllergyTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="allergy_allergy_type" recordId={id} />;
}
