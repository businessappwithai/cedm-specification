import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/nonprofit-campaign-status/$id')({
  component: NonprofitCampaignStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function NonprofitCampaignStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="nonprofit_campaign_status" recordId={id} />;
}
