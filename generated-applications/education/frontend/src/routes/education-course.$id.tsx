import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/education-course/$id')({
  component: EducationCourseDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EducationCourseDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="education_course" recordId={id} />;
}
