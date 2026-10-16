import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/language-direction/$id')({
  component: LanguageDirectionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LanguageDirectionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="language_direction" recordId={id} />;
}
