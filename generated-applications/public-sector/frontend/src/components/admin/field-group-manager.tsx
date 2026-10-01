/**
 * Field Group Manager
 *
 * Component for managing field groups - add, edit, delete, and reorder groups.
 * Shows groups with their column layouts and field counts.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, GripVertical, LayoutGrid, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  type FieldGroup,
  useCreateFieldGroup,
  useDeleteFieldGroup,
  useFieldGroups,
  useUpdateFieldGroup,
} from "@/hooks/use-entities";
import { cn } from "@/lib/utils";
import { Box, HStack, Heading, Text, VStack } from "@/components/ui/layout";

interface FieldGroupManagerProps {
  entityName: string;
}

interface ColumnLayoutOption {
  value: number;
  label: string;
  icon: string;
}

const COLUMN_LAYOUTS: ColumnLayoutOption[] = [
  { value: 1, label: "1 Column", icon: "▯" },
  { value: 2, label: "2 Columns", icon: "▯▯" },
  { value: 3, label: "3 Columns", icon: "▯▯▯" },
  { value: 4, label: "4 Columns", icon: "▯▯▯▯" },
];

export function FieldGroupManager({ entityName }: FieldGroupManagerProps) {
  const { data: groups, isLoading } = useFieldGroups(entityName);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newGroupMode, setNewGroupMode] = useState(false);

  // Form state for new/edit group
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    columns: 1,
    layout_type: "single",
  });

  // Mutations
  const createMutation = useCreateFieldGroup(entityName);
  const updateMutation = useUpdateFieldGroup(entityName);
  const deleteMutation = useDeleteFieldGroup(entityName);

  // Reset form
  const resetForm = () => {
    setFormData({ name: "", description: "", columns: 1, layout_type: "single" });
    setEditingGroup(null);
    setNewGroupMode(false);
  };

  // Start editing a group
  const startEdit = (group: FieldGroup) => {
    setFormData({
      name: group.name,
      description: group.description || "",
      columns: group.columns,
      layout_type: group.layout_type,
    });
    setEditingGroup(group.sys_field_group_id);
    setNewGroupMode(false);
  };

  // Get layout type from columns
  const getLayoutType = (columns: number): string => {
    switch (columns) {
      case 1:
        return "single";
      case 2:
        return "two-column";
      case 3:
        return "three-column";
      case 4:
        return "four-column";
      default:
        return "single";
    }
  };

  if (isLoading) {
    return (
      <HStack align="center" justify="center" padding={8}>
        <div className="text-sm text-muted-foreground">Loading field groups...</div>
      </HStack>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <HStack align="center" justify="between">
        <div>
          <Heading level={3}>Field Groups</Heading>
          <Text size="sm" color="secondary" block>
            Organize fields into sections with multi-column layouts
          </Text>
        </div>
        <button type="button"
          onClick={() => {
            resetForm();
            setNewGroupMode(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Add Group
        </button>
      </HStack>

      {/* New Group Form */}
      {newGroupMode && (
        <Box radius="lg" padding={6} bg="surface" border="default">
          <Heading level={4} className="text-md mb-4">Create New Field Group</Heading>
          <GroupForm
            formData={formData}
            setFormData={setFormData}
            onCancel={resetForm}
            onSave={() => {
              createMutation.mutate(formData as any, {
                onSuccess: () => {
                  resetForm();
                },
              });
            }}
            isSaving={createMutation.isPending}
          />
        </Box>
      )}

      {/* Groups List */}
      <div className="space-y-4">
        {!groups || groups.length === 0 ? (
          <Box padding={8} radius="lg" border="default" className="text-center border-dashed">
            <Text color="secondary" block>No field groups defined yet.</Text>
            <Text size="sm" color="secondary" block className="mt-2">
              Click "Add Group" to create your first group.
            </Text>
          </Box>
        ) : (
          groups.map((group) => (
            <GroupCard
              key={group.sys_field_group_id}
              group={group}
              isEditing={editingGroup === group.sys_field_group_id}
              formData={formData}
              setFormData={setFormData}
              onEdit={() => startEdit(group)}
              onCancel={resetForm}
              onSave={() => {
                updateMutation.mutate(
                  { id: group.sys_field_group_id, data: formData as Partial<FieldGroup> },
                  {
                    onSuccess: () => {
                      resetForm();
                    },
                  }
                );
              }}
              onDelete={() => {
                if (
                  confirm(
                    `Are you sure you want to delete "${group.name}"? Fields in this group will become ungrouped.`
                  )
                ) {
                  deleteMutation.mutate(group.sys_field_group_id);
                }
              }}
              isSaving={updateMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface GroupFormProps {
  formData: {
    name: string;
    description: string;
    columns: number;
    layout_type: string;
  };
  setFormData: (data: any) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

function GroupForm({ formData, setFormData, onCancel, onSave, isSaving = false }: GroupFormProps) {
  return (
    <div className="space-y-4">
      {/* Group Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Group Name *
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Personal Information"
            className="mt-1 w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Description
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description of this group"
            rows={2}
            className="mt-1 w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </label>
      </div>

      {/* Column Layout */}
      <div>
        <p className="block text-sm font-medium mb-2">Column Layout</p>
        <HStack gap={3}>
          {COLUMN_LAYOUTS.map((layout) => (
            <button
              key={layout.value}
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  columns: layout.value,
                  layout_type: getLayoutType(layout.value),
                })
              }
              className={cn(
                "flex-1 p-3 border-2 rounded-lg transition-all",
                "hover:border-primary/50",
                formData.columns === layout.value ? "border-primary bg-primary/10" : "border-border"
              )}
            >
              <VStack align="center" gap={2}>
                <div className="text-2xl tracking-widest opacity-70">{layout.icon}</div>
                <div className="text-xs font-medium">{layout.label}</div>
              </VStack>
            </button>
          ))}
        </HStack>
      </div>

      {/* Actions */}
      <HStack justify="end" gap={3} className="pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!formData.name.trim() || isSaving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Group
        </button>
      </HStack>
    </div>
  );
}

interface GroupCardProps {
  group: FieldGroup;
  isEditing: boolean;
  formData: {
    name: string;
    description: string;
    columns: number;
    layout_type: string;
  };
  setFormData: (data: any) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

function GroupCard({
  group,
  isEditing,
  formData,
  setFormData,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: GroupCardProps) {
  return (
    <div
      className={cn("border rounded-lg bg-card transition-all", isEditing && "ring-2 ring-primary")}
    >
      {isEditing ? (
        <div className="p-6">
          <Heading level={4} className="text-md mb-4">Edit Group</Heading>
          <GroupForm
            formData={formData}
            setFormData={setFormData}
            onCancel={onCancel}
            onSave={onSave}
            isSaving={isSaving}
          />
        </div>
      ) : (
        <div className="p-6">
          <HStack align="start" justify="between">
            <HStack align="start" gap={4} grow>
              {/* Drag Handle */}
              <div className="mt-1 text-muted-foreground cursor-grab">
                <GripVertical size={20} />
              </div>

              {/* Group Info */}
              <div className="flex-1">
                <HStack align="center" gap={3} className="mb-2">
                  <Heading level={4} className="text-md">{group.name}</Heading>
                  <Text size="xs" color="accent" className="px-2 py-1 bg-primary/10 rounded-full">
                    {group.columns} column{group.columns > 1 ? "s" : ""}
                  </Text>
                </HStack>

                {group.description && (
                  <Text size="sm" color="secondary" block className="mb-3">{group.description}</Text>
                )}

                {/* Layout Preview */}
                <HStack align="center" gap={2} className="text-xs text-muted-foreground">
                  <LayoutGrid size={12} />
                  <span>
                    Layout: <Text weight="medium" className="capitalize">{group.layout_type}</Text>
                  </span>
                </HStack>
              </div>
            </HStack>

            {/* Actions */}
            <HStack align="center" gap={2}>
              <button type="button"
                onClick={onEdit}
                disabled={isSaving || isDeleting}
                className="p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                title="Edit group"
              >
                <Pencil size={16} />
              </button>
              <button type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors disabled:opacity-50"
                title="Delete group"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </HStack>
          </HStack>
        </div>
      )}
    </div>
  );
}

// Helper function to get layout type from columns
function getLayoutType(columns: number): string {
  switch (columns) {
    case 1:
      return "single";
    case 2:
      return "two-column";
    case 3:
      return "three-column";
    case 4:
      return "four-column";
    default:
      return "single";
  }
}
