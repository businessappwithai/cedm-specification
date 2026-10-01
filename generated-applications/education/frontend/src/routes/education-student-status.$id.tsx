import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/education-student-status/$id')({
  component: EducationStudentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EducationStudentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="education_student_status" recordId={id} />;
}
