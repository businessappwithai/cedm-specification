import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/enrollment-study-mode/$id')({
  component: EnrollmentStudyModeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EnrollmentStudyModeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="enrollment_study_mode" recordId={id} />;
}
