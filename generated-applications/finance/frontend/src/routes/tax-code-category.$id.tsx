import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/tax-code-category/$id')({
  component: TaxCodeCategoryDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TaxCodeCategoryDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="tax_code_category" recordId={id} />;
}
