import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/emission-source-quality/$id')({
  component: EmissionSourceQualityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function EmissionSourceQualityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="emission_source_quality" recordId={id} />;
}
