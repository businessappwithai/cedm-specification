import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/opportunity-stage/$id')({
  component: OpportunityStageDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function OpportunityStageDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="opportunity_stage" recordId={id} />;
}
