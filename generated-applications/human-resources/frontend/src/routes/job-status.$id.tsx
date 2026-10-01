import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/job-status/$id')({
  component: JobStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function JobStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="job_status" recordId={id} />;
}
