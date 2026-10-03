import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Box, HStack, Text } from "@/components/ui/layout";
import { apiClient } from "@/lib/api-client";

interface Move {
  tableName: string;
  statusField: string;
  from: string;
  to: string;
  transition: string | null;
}

interface WorkflowStateBarProps {
  /** Physical table, e.g. `bus_sales_order` — what the state machine is drawn against. */
  tableName: string;
  /** `/bus/<table>` — where the move is written. */
  endpoint: string;
  recordId: string;
  record: Record<string, unknown>;
  /** Called after a move is accepted, so the page can read the record again. */
  onMoved: () => void;
}

const words = (value: string) =>
  value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/**
 * The state a record is in and the moves out of it.
 *
 * A status column rendered as a text box or a free dropdown offers moves the
 * state machine does not draw, and the write is refused only after the user has
 * committed to it. The machine is read from the dictionary
 * (`/workflows/transitions`) and the buttons are exactly the edges that leave
 * the current state, so what is offered is what will be accepted. A table with
 * no machine renders nothing.
 */
export function WorkflowStateBar({
  tableName,
  endpoint,
  recordId,
  record,
  onMoved,
}: WorkflowStateBarProps) {
  const { data: machine } = useQuery({
    queryKey: ["workflow-machine", tableName],
    queryFn: () => apiClient.get<Move[]>("/workflows/transitions", { table: tableName }),
    staleTime: 60_000,
  });

  const move = useMutation({
    mutationFn: (step: Move) =>
      apiClient.patch(`${endpoint}/${recordId}`, { [step.statusField]: step.to }),
    onSuccess: (_data, step) => {
      toast.success(`${step.transition ? words(step.transition) : "Moved"}: now ${words(step.to)}`);
      onMoved();
    },
    onError: (err: unknown) => {
      const e = err as { errors?: string[]; message?: string | string[] };
      const text =
        e?.errors?.join(", ") ??
        (Array.isArray(e?.message) ? e.message.join(", ") : e?.message) ??
        "That move was refused";
      toast.error(text);
    },
  });

  const moves = Array.isArray(machine) ? machine : [];
  const field = moves[0]?.statusField;
  if (!field) return null;

  const current = String(record[field] ?? "");
  const next = moves.filter((m) => m.from === current);

  return (
    <Box
      className="workflow-state-bar rounded-md border px-4 py-2"
      data-testid="workflow-state-bar"
    >
      <HStack align="center" gap={3} wrap>
        <Text size="xs" color="secondary" weight="medium">
          State
        </Text>
        <Badge variant="default" data-testid="workflow-current-state">
          {current ? words(current) : "Not set"}
        </Badge>
        {next.length > 0 ? (
          <>
            <Text size="xs" color="secondary">
              Next
            </Text>
            {next.map((step) => (
              <Button
                key={`${step.from}-${step.to}`}
                type="button"
                variant="secondary"
                size="sm"
                disabled={move.isPending}
                data-testid={`workflow-move-${step.to}`}
                onClick={() => move.mutate(step)}
              >
                {step.transition ? words(step.transition) : `→ ${words(step.to)}`}
              </Button>
            ))}
          </>
        ) : (
          <Text size="xs" color="secondary">
            No further moves from here
          </Text>
        )}
      </HStack>
    </Box>
  );
}
