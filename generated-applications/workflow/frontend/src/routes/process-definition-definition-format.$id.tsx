import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/process-definition-definition-format/$id')({
  component: ProcessDefinitionDefinitionFormatDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProcessDefinitionDefinitionFormatDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="process_definition_definition_format" recordId={id} />;
}
