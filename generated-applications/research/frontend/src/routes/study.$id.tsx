import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/study/$id')({
  component: StudyDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function StudyDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="study" recordId={id} />;
}
