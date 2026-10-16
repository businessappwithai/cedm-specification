import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/campaign-status/$id')({
  component: CampaignStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CampaignStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="campaign_status" recordId={id} />;
}
