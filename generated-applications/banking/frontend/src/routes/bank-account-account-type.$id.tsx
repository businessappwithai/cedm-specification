import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/bank-account-account-type/$id')({
  component: BankAccountAccountTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BankAccountAccountTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="bank_account_account_type" recordId={id} />;
}
