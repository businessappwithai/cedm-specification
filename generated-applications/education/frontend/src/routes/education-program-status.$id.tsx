import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/education-program-status/$id')({
  component: EducationProgramStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EducationProgramStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="education_program_status" recordId={id} />;
}
