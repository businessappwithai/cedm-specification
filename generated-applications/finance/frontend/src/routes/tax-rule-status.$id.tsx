import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/tax-rule-status/$id')({
  component: TaxRuleStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaxRuleStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="tax_rule_status" recordId={id} />;
}
