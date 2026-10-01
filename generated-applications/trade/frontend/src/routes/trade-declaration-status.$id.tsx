import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/trade-declaration-status/$id')({
  component: TradeDeclarationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TradeDeclarationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="trade_declaration_status" recordId={id} />;
}
