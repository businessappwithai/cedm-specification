/**
 * Ask a question about the data (decision D5).
 *
 * Talks to `POST /api/ai/query`, which answers with the rows plus the
 * *validated plan* the question was translated into. Showing that plan is the
 * point rather than a debugging nicety: the backend never lets the model write
 * SQL, so the plan is the whole of what ran, and a reader can tell at a glance
 * whether the question was understood before trusting the number underneath it.
 *
 * The panel deliberately renders nothing clever. Results are the same rows
 * `/api/bus/{entity}` returns, so `DynamicTable` — the component every list
 * screen in this app already uses — displays them, and a "how many" question
 * shows the count large instead; that is what `displayHint` selects.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, HStack, VStack, Heading, Text } from "@/components/ui/layout";
import { DynamicTable } from "@/components/tables/dynamic-table";

interface PlanFilter {
  column: string;
  op: string;
  value: string;
}

interface QueryPlan {
  entity: string;
  filters?: PlanFilter[];
  search?: string | null;
  order_by?: string | null;
  order_dir?: string | null;
  limit?: number | null;
  display_hint?: string | null;
  summary?: string | null;
}

interface QueryAnswer {
  success: boolean;
  data: Array<Record<string, unknown>>;
  count: number;
  entity: string;
  displayHint: "table" | "number" | string;
  summary: string | null;
  plan: QueryPlan;
  executionTimeMs: number;
}

/** The plan, in one readable line. */
function planSummary(plan: QueryPlan): string {
  const parts = [plan.entity];
  for (const filter of plan.filters ?? []) {
    parts.push(`${filter.column} ${filter.op} ${filter.value}`);
  }
  if (plan.search) parts.push(`search "${plan.search}"`);
  if (plan.order_by) parts.push(`sorted by ${plan.order_by} ${plan.order_dir ?? "asc"}`);
  if (plan.limit) parts.push(`limit ${plan.limit}`);
  return parts.join(" · ");
}

export function NlQueryPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QueryAnswer | null>(null);
  const navigate = useNavigate();

  const ask = useMutation({
    mutationFn: (query: string) => apiClient.post<QueryAnswer>("/ai/query", { query }),
    onSuccess: (result) => setAnswer(result),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed) ask.mutate(trimmed);
  };

  // A 503 means the add-on is not configured, which is the default and is not
  // an error the operator needs to debug — so it reads as a setup note rather
  // than a failure.
  const notConfigured =
    ask.isError && getErrorMessage(ask.error).toLowerCase().includes("not configured");

  // The dictionary routes and the record routes both take the entity unprefixed
  // — `/bus/compound/fields/grid`, `/compound/{id}` — while the answer names
  // the table it actually read. Strip once, here, rather than at each use.
  const entityName = answer ? answer.entity.replace(/^bus_/, "") : "";

  return (
    <VStack gap={4}>
      <form onSubmit={submit}>
        <HStack gap={2} align="center">
          {/* `grow` on a wrapper rather than on the Input: the Input adapter
              forwards no layout props, so without this the question box renders
              at its intrinsic width — about 25 characters on a 960px page, for
              the one control the whole page exists to serve. */}
          <Box grow>
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about your data — e.g. “how many compounds were added this month?”"
              aria-label="Question"
              disabled={ask.isPending}
            />
          </Box>
          {/* A plain string label, and `isLoading` for the spinner. The Button
              adapter passes a string child to Astryx's `label` prop and
              anything else to `children`, which Astryx stacks vertically — an
              icon plus a `<span>` rendered the magnifier sitting on top of the
              word "Ask". Every other labelled button in this app is a string
              for the same reason. */}
          <Button
            type="submit"
            disabled={ask.isPending || !question.trim()}
            isLoading={ask.isPending}
          >
            Ask
          </Button>
        </HStack>
      </form>

      {notConfigured && (
        <Card>
          <VStack gap={2}>
            <Heading level={3}>Natural-language querying is turned off</Heading>
            <Text size="sm" color="secondary">
              Set <code>LOCAL_AI_BASE_URL</code> and <code>LOCAL_AI_MODEL</code> in the backend’s
              environment and restart it. Any OpenAI-compatible endpoint works. Nothing else in the
              application changes while it is off.
            </Text>
          </VStack>
        </Card>
      )}

      {ask.isError && !notConfigured && (
        <Card>
          <HStack gap={2} align="center">
            <AlertCircle size={16} />
            <Text size="sm">{getErrorMessage(ask.error)}</Text>
          </HStack>
        </Card>
      )}

      {answer && (
        <Card>
          <VStack gap={3}>
            {answer.summary && <Text size="sm">{answer.summary}</Text>}

            {/* What actually ran. Shown because the plan *is* the query. */}
            <Text size="xs" color="secondary">
              {planSummary(answer.plan)} · {answer.count} row{answer.count === 1 ? "" : "s"} ·{" "}
              {answer.executionTimeMs}ms
            </Text>

            {answer.displayHint === "number" ? (
              <Box>
                <Heading level={1}>{answer.count}</Heading>
                <Text size="sm" color="secondary">
                  matching {entityName}
                </Text>
              </Box>
            ) : answer.data.length === 0 ? (
              <EmptyState
                title="No matching records"
                description="The question was understood — nothing in this entity matches it."
              />
            ) : (
              /* The same component every list screen uses, for the same reason
                 the answer comes back as plain `/api/bus/*` rows: an answer
                 should look like the records it is about. Hand-rolling a table
                 here rendered raw `sys_column` names as headers and raw UUIDs
                 in every foreign key — `registered_by_id` showed
                 `cda967a2-…` where the Compound screen one click away showed
                 "Ada Lovelace". DynamicTable reads the dictionary for the
                 labels, the column order and the grid's own hidden set, and
                 batch-resolves lookups to their identifier columns.

                 No pagination props on purpose: a plan returns one capped page,
                 and DynamicTable hides both the pager and the "showing N of M"
                 line while `totalCount` is 0. */
              <DynamicTable
                tableName={entityName}
                data={answer.data}
                onRowClick={(row) =>
                  navigate({
                    to: "/$entity/$id",
                    params: { entity: entityName, id: String(row.id) },
                  })
                }
              />
            )}
          </VStack>
        </Card>
      )}
    </VStack>
  );
}

export default NlQueryPanel;
