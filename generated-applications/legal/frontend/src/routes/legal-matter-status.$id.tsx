import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/legal-matter-status/$id')({
  component: LegalMatterStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LegalMatterStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="legal_matter_status" recordId={id} />;
}
