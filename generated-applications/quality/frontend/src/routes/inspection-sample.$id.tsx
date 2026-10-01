import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/inspection-sample/$id')({
  component: InspectionSampleDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InspectionSampleDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="inspection_sample" recordId={id} />;
}
