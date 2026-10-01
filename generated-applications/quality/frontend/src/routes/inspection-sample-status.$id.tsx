import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/inspection-sample-status/$id')({
  component: InspectionSampleStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function InspectionSampleStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="inspection_sample_status" recordId={id} />;
}
