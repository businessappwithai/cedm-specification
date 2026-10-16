import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contact-contact-role/$id')({
  component: ContactContactRoleDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContactContactRoleDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contact_contact_role" recordId={id} />;
}
