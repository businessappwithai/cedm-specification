import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contact-point-purpose/$id')({
  component: ContactPointPurposeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContactPointPurposeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contact_point_purpose" recordId={id} />;
}
