import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contact-point-status/$id')({
  component: ContactPointStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContactPointStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contact_point_status" recordId={id} />;
}
