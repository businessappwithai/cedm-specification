import {
  Copy,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HStack } from "@/components/ui/layout";

interface ADToolbarProps {
  onNew?: () => void;
  onCopy?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRefresh?: () => void;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onAdvancedSearchToggle?: () => void;
  advancedFilterCount?: number;
  isSaving?: boolean;
  isDeleting?: boolean;
  hasChanges?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  /**
   * False for a record in a final state: a completed transaction the API
   * refuses to change, so the screen does not offer a form it would refuse.
   */
  canEdit?: boolean;
  isEditing?: boolean;
  isDetailView?: boolean;
  isAdvancedSearchOpen?: boolean;
}

export function ADToolbar({
  onNew,
  onCopy,
  onSave,
  onDelete,
  onUndo,
  onRefresh,
  onEdit,
  onCancelEdit,
  onAdvancedSearchToggle,
  advancedFilterCount = 0,
  isSaving,
  isDeleting,
  hasChanges,
  canDelete = true,
  canCreate = true,
  canEdit = true,
  isEditing = false,
  isDetailView = false,
  isAdvancedSearchOpen = false,
}: ADToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <HStack align="center" gap={2} paddingInline={5} paddingBlock={3} wrap className="border-b border-border bg-muted/20">
        {/* Search button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isAdvancedSearchOpen ? "secondary" : "outline"}
              size="sm"
              onClick={onAdvancedSearchToggle}
              className="h-9 gap-2 px-3 text-sm font-medium"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Search</span>
              {advancedFilterCount > 0 && (
                <Badge variant="default" className="h-4 px-1 text-[10px] min-w-[16px]">
                  {advancedFilterCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Advanced Search</TooltipContent>
        </Tooltip>

        {canCreate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onNew}
                className="h-9 gap-2 px-3 text-sm font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">New</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Record</TooltipContent>
          </Tooltip>
        )}

        {onCopy && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onCopy}
                className="h-9 gap-2 px-3 text-sm font-medium"
              >
                <Copy size={16} />
                <span className="hidden sm:inline">Copy</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy Record</TooltipContent>
          </Tooltip>
        )}

        {(isDetailView || isEditing) && <Separator orientation="vertical" className="h-7 mx-1" />}

        {/* Detail view action buttons */}
        {isDetailView && !isEditing && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={onEdit}
                disabled={!canEdit}
                aria-disabled={!canEdit}
                className="h-9 gap-2 px-4 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
              >
                <Pencil size={16} />
                Edit
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {canEdit ? "Edit Record" : "Closed — this transaction is complete and cannot be changed or deleted"}
            </TooltipContent>
          </Tooltip>
        )}

        {isEditing && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving || !hasChanges}
                  className="h-9 gap-2 px-4 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
                >
                  <Save size={16} />
                  {isSaving ? "Saving…" : "Save Changes"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Changes</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={onCancelEdit}
                  className="h-9 gap-2 px-4 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                >
                  <X size={16} />
                  Cancel
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cancel Editing</TooltipContent>
            </Tooltip>

            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="h-9 gap-2 px-4 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    {isDeleting ? "Deleting…" : "Delete"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Record</TooltipContent>
              </Tooltip>
            )}

            {hasChanges && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUndo}
                    className="h-9 gap-2 px-3 text-sm font-medium"
                  >
                    <RotateCcw size={16} />
                    <span className="hidden sm:inline">Undo</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo Changes</TooltipContent>
              </Tooltip>
            )}
          </>
        )}

        {/* Commit inline edits made in the grid.
            Only when there are edits to commit: a list is a read-only view
            until someone types in a cell, and a permanently disabled Save in
            the primary toolbar position said the opposite — that the grid was
            a form the visitor had failed to fill in. */}
        {!isDetailView && hasChanges && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="h-9 gap-2 px-4 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
              >
                <Save size={16} />
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save</TooltipContent>
          </Tooltip>
        )}

        <div className="ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
              >
                <RefreshCw size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
        </div>
      </HStack>
    </TooltipProvider>
  );
}
