import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/bank-loan-interest-type/$id')({
  component: BankLoanInterestTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BankLoanInterestTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="bank_loan_interest_type" recordId={id} />;
}
