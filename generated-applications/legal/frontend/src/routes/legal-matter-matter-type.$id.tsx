import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/legal-matter-matter-type/$id')({
  component: LegalMatterMatterTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LegalMatterMatterTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="legal_matter_matter_type" recordId={id} />;
}
