import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/campaign-campaign-type/$id')({
  component: CampaignCampaignTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CampaignCampaignTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="campaign_campaign_type" recordId={id} />;
}
