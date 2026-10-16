import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/legal-entity-status/$id')({
  component: LegalEntityStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LegalEntityStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="legal_entity_status" recordId={id} />;
}
