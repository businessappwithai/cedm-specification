import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contact-preferred-channel/$id')({
  component: ContactPreferredChannelDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContactPreferredChannelDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contact_preferred_channel" recordId={id} />;
}
