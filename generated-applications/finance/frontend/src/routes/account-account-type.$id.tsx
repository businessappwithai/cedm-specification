import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/account-account-type/$id')({
  component: AccountAccountTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AccountAccountTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="account_account_type" recordId={id} />;
}
