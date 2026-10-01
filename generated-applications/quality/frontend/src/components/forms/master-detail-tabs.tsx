/**
 * Master Detail Tabs Component - Swiss Clean Design
 *
 * Displays related entities in elegant tabs for a parent record.
 * Each tab shows a list of related child records with CRUD operations.
 * Tabs are lazy-loaded - data is fetched only when the tab is clicked.
 *
 * Swiss Clean Design Features:
 * - Teal primary (#0D6E6E) with gradient accents
 * - Orange destructive (#E07B54) for warning actions
 * - Rounded corners (rounded-xl, rounded-2xl)
 * - Gradient backgrounds with backdrop blur
 * - Refined borders and subtle shadows
 * - Newsreader, Inter, JetBrains Mono fonts
 *
 * Features:
 * - Lazy loading of tab content
 * - Full CRUD operations on child records
 * - Back navigation returns to tab list
 * - New records appear at top of list after save
 *
 * Auto-generated component
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ChevronLeft, FileText, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { DynamicTable } from "@/components/tables/dynamic-table";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useTableMetadata } from "@/hooks/use-entities";
import { apiClient } from "@/lib/api-client";
import { useTranslations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Box, HStack, Heading, Text, VStack } from "@/components/ui/layout";

interface MasterDetailTab {
  id: string;
  label: string;
  tableName: string;
  parentField: string; // Field name in child table that references parent
  icon?: React.ReactNode; // Optional - if not provided, will fetch from sys_table
}

interface MasterDetailTabsProps {
  parentId: string;
  parentTable: string;
  tabs: MasterDetailTab[];
}

export function MasterDetailTabs({ parentId, parentTable, tabs }: MasterDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  // Resolved once and guarded, rather than asserted at the call site: `activeTab`
  // is an id held in state and the tab it names can disappear when `tabs`
  // changes underneath it.
  const activeTabDef = activeTab ? tabs.find((t) => t.id === activeTab) : undefined;
  const queryClient = useQueryClient();

  const handleTabChange = (tabId: string) => {
    if (activeTab === tabId) {
      // If clicking the same tab, close it
      setActiveTab(null);
    } else {
      // Open the new tab
      setActiveTab(tabId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Swiss Clean Design */}
      <Box radius="lg" padding={1} border="default" className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 backdrop-blur-sm shadow-sm">
        <nav className="flex flex-wrap gap-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <TabWithIcon
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            />
          ))}
        </nav>
      </Box>

      {/* Tab Content */}
      {activeTabDef && (
        <MasterDetailTabContent
          key={activeTabDef.id}
          tab={activeTabDef}
          parentId={parentId}
          parentTable={parentTable}
          onClose={() => setActiveTab(null)}
        />
      )}
    </div>
  );
}

/**
 * Tab button with icon fetched from sys_table
 */
interface TabWithIconProps {
  tab: MasterDetailTab;
  isActive: boolean;
  onClick: () => void;
}

function TabWithIcon({ tab, isActive, onClick }: TabWithIconProps) {
  // Fetch table metadata if no icon is provided
  const shouldFetchIcon = !tab.icon;
  const { data: tableMetadata } = useTableMetadata(shouldFetchIcon ? tab.tableName : "");

  const icon = tab.icon || (tableMetadata?.icon && <Icon name={tableMetadata.icon} size={16} />);

  return (
    <button type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
          : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
      )}
    >
      {icon && <span className="opacity-70">{icon}</span>}
      {tab.label}
    </button>
  );
}

interface MasterDetailTabContentProps {
  tab: MasterDetailTab;
  parentId: string;
  parentTable: string;
  onClose: () => void;
}

function MasterDetailTabContent({
  tab,
  parentId,
  parentTable,
  onClose,
}: MasterDetailTabContentProps) {
  const { t } = useTranslations();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch table metadata for icon if not provided
  const shouldFetchIcon = !tab.icon;
  const { data: tableMetadata } = useTableMetadata(shouldFetchIcon ? tab.tableName : "");
  const icon = tab.icon || (tableMetadata?.icon && <Icon name={tableMetadata.icon} size={20} />);

  // Fetch related records with filter for parent
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [tab.tableName, parentId],
    queryFn: async () => {
      const filterField = tab.parentField;
      // Build query string with filter for parent field
      const params = new URLSearchParams({
        limit: "100",
        [filterField]: parentId,
      });
      const response = await apiClient.get<{ data: any[] }>(
        `/api/bus/${tab.tableName}?${params.toString()}`
      );
      return response.data || [];
    },
    enabled: !!parentId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/bus/${tab.tableName}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tab.tableName, parentId] });
      toast.success(t("tabs.recordDeleted" as any));
    },
    onError: (error: Error) => {
      toast.error(`${t("tabs.deleteFailed" as any)}: ${error.message}`);
    },
  });

  // Loading state - Swiss Clean Design
  if (isLoading) {
    return (
      <Box radius="lg" padding={8} border="default" className="border-border/60 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-md">
        <HStack align="center" justify="center" className="py-12">
          <VStack align="center" gap={4}>
            <Loader2 className="h-12 w-12 animate-spin text-primary/70" />
            <Text size="sm" color="secondary" block>
              {`${t("tabs.loading" as any)} ${tab.label.toLowerCase()}`}
            </Text>
          </VStack>
        </HStack>
      </Box>
    );
  }

  // Error state - Swiss Clean Design
  if (error) {
    return (
      <Box radius="lg" padding={6} border="strong" className="border-destructive/50 bg-gradient-to-br from-destructive/10 to-destructive/5 backdrop-blur-sm shadow-lg shadow-destructive/10">
        <HStack align="center" gap={4}>
          <HStack align="center" justify="center" className="h-12 w-12 rounded-full bg-destructive/20">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </HStack>
          <div className="flex-1">
            <Text weight="semibold" color="danger" block>
              {`${t("tabs.loadFailed" as any)} ${tab.label}`}
            </Text>
            <Text size="sm" color="secondary" block className="mt-1">
              {error instanceof Error ? error.message : "Unknown error"}
            </Text>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="shadow-sm">
            Retry
          </Button>
        </HStack>
      </Box>
    );
  }

  // Create mode - Swiss Clean Design
  if (isCreating) {
    return (
      <Box radius="lg" padding={6} border="default" className="border-border/60 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-md">
        <HStack align="center" justify="between" className="mb-6">
          <HStack align="center" gap={3}>
            <HStack align="center" justify="center" className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
              <Plus size={20} />
            </HStack>
            <div>
              <Heading level={3} color="primary">
                New {tab.label.slice(0, -1)}
              </Heading>
              <Text size="sm" color="secondary" block>
                Create a new record linked to this{" "}
                {parentTable.replace("bus_", "").replace("_", " ")}
              </Text>
            </div>
          </HStack>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(false)}
            className="shadow-sm"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </HStack>
        <CreateEntityForm
          tableName={tab.tableName}
          parentField={tab.parentField}
          parentId={parentId}
          onCancel={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            refetch();
          }}
        />
      </Box>
    );
  }

  // Edit mode - Swiss Clean Design
  if (selectedId) {
    return (
      <Box radius="lg" padding={6} border="default" className="border-border/60 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-md">
        <HStack align="center" justify="between" className="mb-6">
          <HStack align="center" gap={3}>
            <HStack align="center" justify="center" className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
              <FileText size={20} />
            </HStack>
            <div>
              <Heading level={3} color="primary">
                Edit {tab.label.slice(0, -1)}
              </Heading>
              <Text size="sm" color="secondary" block>Modify the record details</Text>
            </div>
          </HStack>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedId(null)}
            className="shadow-sm"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </HStack>
        <EditEntityWrapper
          tableName={tab.tableName}
          recordId={selectedId}
          parentField={tab.parentField}
          onCancel={() => setSelectedId(null)}
          onSuccess={() => {
            setSelectedId(null);
            refetch();
          }}
        />
      </Box>
    );
  }

  // List view - Swiss Clean Design
  const hasData = data && data.length > 0;

  return (
    <Box radius="lg" padding={6} border="default" className="border-border/60 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-md">
      <HStack align="center" justify="between" className="mb-6">
        <HStack align="center" gap={3}>
          {icon && (
            <HStack align="center" justify="center" className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
              {icon}
            </HStack>
          )}
          <div>
            <Heading level={3} color="primary">{tab.label}</Heading>
            <Text size="sm" color="secondary" block>
              {hasData
                ? `${data.length} record${data.length > 1 ? "s" : ""} found`
                : "No records yet"}
            </Text>
          </div>
        </HStack>
        <Button onClick={() => setIsCreating(true)} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          New {tab.label.slice(0, -1)}
        </Button>
      </HStack>

      {hasData ? (
        <DynamicTable
          data={data}
          tableName={tab.tableName}
          onDelete={(id) => {
            deleteMutation.mutate(id);
          }}
          onView={(id) => setSelectedId(id)}
          onEdit={(id) => setSelectedId(id)}
        />
      ) : (
        <Box radius="lg" border="strong" className="border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <VStack align="center" gap={4}>
            <HStack align="center" justify="center" className="h-16 w-16 rounded-full bg-muted/40">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </HStack>
            <div>
              <Text color="secondary" weight="medium" block>
                No {tab.label.toLowerCase()} found
              </Text>
              <Text size="sm" color="secondary" block className="mt-1">
                Click "New {tab.label.slice(0, -1)}" to create the first record
              </Text>
            </div>
          </VStack>
        </Box>
      )}
    </Box>
  );
}

// Inline form for creating new records
interface CreateEntityFormProps {
  tableName: string;
  parentField: string;
  parentId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

function CreateEntityForm({
  tableName,
  parentField,
  parentId,
  onCancel,
  onSuccess,
}: CreateEntityFormProps) {
  const { t } = useTranslations();
  const mutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      // Set the parent field value
      const dataWithParent = {
        ...formData,
        [parentField]: parentId,
      };
      return apiClient.post(`/api/bus/${tableName}`, dataWithParent);
    },
    onSuccess: () => {
      toast.success(t("tabs.recordCreated" as any));
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`${t("tabs.createFailed" as any)}: ${error.message}`);
    },
  });

  return (
    <Box radius="lg" padding={4} border="default" className="border-border/40 bg-muted/10">
      <DynamicForm
        tableName={tableName}
        initialData={{ [parentField]: parentId }}
        onSubmit={async (data) => {
          await mutation.mutateAsync(data);
        }}
        isSaving={mutation.isPending}
        mode="create"
        readOnlyFields={[parentField]}
      />
    </Box>
  );
}

// Wrapper for editing entity in place
interface EditEntityWrapperProps {
  tableName: string;
  recordId: string;
  parentField: string;
  onCancel: () => void;
  onSuccess: () => void;
}

function EditEntityWrapper({
  tableName,
  recordId,
  parentField,
  onCancel,
  onSuccess,
}: EditEntityWrapperProps) {
  const { t } = useTranslations();
  const { data: record, isLoading } = useQuery({
    queryKey: [tableName, recordId],
    queryFn: () => apiClient.get<any>(`/api/bus/${tableName}/${recordId}`),
    enabled: !!recordId,
    select: (response) => response.data,
  });

  const mutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      return apiClient.patch(`/api/bus/${tableName}/${recordId}`, formData);
    },
    onSuccess: () => {
      toast.success(t("tabs.recordUpdated" as any));
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`${t("tabs.updateFailed" as any)}: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <HStack align="center" justify="center" className="py-12">
        <VStack align="center" gap={4}>
          <Loader2 className="h-12 w-12 animate-spin text-primary/70" />
          <Text size="sm" color="secondary" block>{t("common.loading" as any)} record...</Text>
        </VStack>
      </HStack>
    );
  }

  return (
    <Box radius="lg" padding={4} border="default" className="border-border/40 bg-muted/10">
      <DynamicForm
        tableName={tableName}
        initialData={record}
        onSubmit={async (data) => {
          await mutation.mutateAsync(data);
        }}
        isSaving={mutation.isPending}
        mode="edit"
        readOnlyFields={[parentField]}
      />
    </Box>
  );
}
