import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/person-gender/$id')({
  component: PersonGenderDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PersonGenderDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="person_gender" recordId={id} />;
}
