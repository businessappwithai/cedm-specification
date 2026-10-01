import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/regulatory-submission/$id')({
  component: RegulatorySubmissionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RegulatorySubmissionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="regulatory_submission" recordId={id} />;
}
