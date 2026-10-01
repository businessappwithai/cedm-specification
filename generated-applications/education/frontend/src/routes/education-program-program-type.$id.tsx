import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/education-program-program-type/$id')({
  component: EducationProgramProgramTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EducationProgramProgramTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="education_program_program_type" recordId={id} />;
}
