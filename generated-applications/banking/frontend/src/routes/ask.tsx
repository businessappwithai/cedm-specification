/**
 * `/ask` — natural-language querying over the business entities (decision D5).
 *
 * A page rather than a floating widget, and outside `/admin`, because the
 * feature answers questions about *business data* and is scoped to whatever the
 * signed-in account may already read. An administrator is not the audience.
 *
 * The panel itself is `components/ai/nl-query-panel`; this file is the route
 * and the framing around it.
 */

import { createFileRoute } from "@tanstack/react-router";

import { NlQueryPanel } from "@/components/ai/nl-query-panel";
import { Box, VStack, Heading, Text } from "@/components/ui/layout";

export const Route = createFileRoute("/ask")({
  component: AskPage,
});

// Hoisted rather than written inline: an inline `style={ {…} }` in a `.hbs`
// template opens with two braces, which Handlebars reads as an expression, and
// generation dies with a parse error.
const pageStyle = { maxWidth: 960, margin: "0 auto" } as const;

function AskPage() {
  return (
    <Box style={pageStyle}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={1}>Ask</Heading>
          <Text size="sm" color="secondary">
            Ask a question in plain language. It is translated into a query over one entity and run
            with your own permissions — you will never see a record you could not open directly.
          </Text>
        </VStack>

        <NlQueryPanel />
      </VStack>
    </Box>
  );
}
