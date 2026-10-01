import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/process-definition/$id')({
  component: ProcessDefinitionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProcessDefinitionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="process_definition" recordId={id} />;
}
