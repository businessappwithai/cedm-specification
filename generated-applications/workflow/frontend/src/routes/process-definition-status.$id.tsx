import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/process-definition-status/$id')({
  component: ProcessDefinitionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProcessDefinitionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="process_definition_status" recordId={id} />;
}
