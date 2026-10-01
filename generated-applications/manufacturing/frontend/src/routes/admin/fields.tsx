import { Suspense } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { LayoutGrid, ChevronLeft } from 'lucide-react';
import { UnifiedFieldLayout } from '@/components/admin/unified-field-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { Box, HStack, Heading, Text, VStack } from "@/components/ui/layout";

export const Route = createFileRoute('/admin/fields')({
  validateSearch: (search: Record<string, unknown>) => ({
    entity: (search.entity as string) || undefined,
  }),
  component: FieldLayoutPage,
});

interface SysTable {
  sys_table_id: string;
  table_name: string;
  name: string;
}

function FieldLayoutPageContent() {
  const search = Route.useSearch();
  const [selectedTable, setSelectedTable] = useState<string>(search.entity ?? '');

  const { data: tablesResponse, isLoading: tablesLoading } = useQuery({
    queryKey: ['admin', 'sys-tables'],
    queryFn: () => apiClient.get<PaginatedResponse<SysTable>>('/sys/tables', { limit: 200 }),
  });

  const sysTables: SysTable[] = (tablesResponse as any)?.data ?? [];

  useEffect(() => {
    if (search.entity) setSelectedTable(search.entity);
  }, [search.entity]);

  const selectedTableMeta = sysTables.find((t) => t.table_name === selectedTable);

  return (
    <Box paddingInline={6} paddingBlock={6} className="max-w-[1400px] mx-auto space-y-6">
      {/* Page header */}
      <HStack align="start" justify="between">
        <div>
          <HStack align="center" gap={2} className="text-sm text-muted-foreground mb-1">
            <Link to="/admin" className="flex items-center gap-1 hover:text-primary transition-colors">
              <ChevronLeft size={14} />
              Admin
            </Link>
            <span>/</span>
            <span>Field Layout Manager</span>
          </HStack>
          <Heading level={1} color="primary" className="text-2xl flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" />
            Field Layout Manager
          </Heading>
          <Text color="secondary" size="sm" block className="mt-1">
            Organize fields into groups, set multi-column layouts, and control visibility — all in one place.
          </Text>
        </div>
      </HStack>

      {/* Entity selector */}
      <HStack align="center" gap={4} padding={4} className="rounded-xl border border-border bg-muted/20">
        <Text size="sm" weight="medium" color="secondary" className="whitespace-nowrap">Select Entity:</Text>
        <Select
          value={selectedTable}
          onValueChange={(value) => setSelectedTable(value)}
        >
          <SelectTrigger className="w-[320px]">
            <SelectValue placeholder="Choose an entity to configure…" />
          </SelectTrigger>
          <SelectContent>
            {tablesLoading ? (
              <Box paddingInline={2} paddingBlock={1.5} className="text-sm text-muted-foreground">Loading…</Box>
            ) : (
              sysTables.map((table) => (
                <SelectItem key={table.sys_table_id} value={table.table_name}>
                  {table.name} ({table.table_name})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {selectedTableMeta && (
          <Badge variant="secondary" className="whitespace-nowrap">
            {selectedTableMeta.name}
          </Badge>
        )}
      </HStack>

      {/* Unified layout editor */}
      {selectedTable ? (
        <UnifiedFieldLayout entityName={selectedTable} />
      ) : (
        <VStack align="center" justify="center" className="py-20 text-center">
          <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <Text color="secondary" weight="medium" block>Select an entity above to begin</Text>
          <Text size="sm" block className="text-muted-foreground/60 mt-1">
            You can then drag fields between groups, set column counts, and control visibility.
          </Text>
        </VStack>
      )}
    </Box>
  );
}

function FieldLayoutPage() {
  return (
    <Suspense fallback={<HStack align="center" justify="center" padding={8}>Loading…</HStack>}>
      <FieldLayoutPageContent />
    </Suspense>
  );
}
