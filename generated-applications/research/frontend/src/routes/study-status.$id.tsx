import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/study-status/$id')({
  component: StudyStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function StudyStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="study_status" recordId={id} />;
}
