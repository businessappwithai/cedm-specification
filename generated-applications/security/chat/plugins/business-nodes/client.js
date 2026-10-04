// Browser half of the business cards, in the Harness client's module format.
//
// Two cards, registered into the keyed `tool.call.toolview` slot by tool name:
//
// - **Application card** (open_record, open_create_form, open_update_form,
//   request_approval): the application's own screen in a sandboxed frame,
//   loaded through the gateway's view id — never a URL the model wrote. When
//   the screen saves, it posts a `record-saved` message; the card checks the
//   message came from its own frame and from this origin, asks the gateway to
//   read the record back, and adds the gateway's notice to the conversation.
// - **Report card** (run_approved_report): the report as a paged table,
//   fetched live through the gateway with the person's reporting session, with
//   the platform's own export and its own report page one click away.
//
// Cards hold only the stable descriptor the tool returned (`meta`); rows and
// screens are fetched when shown and never written into the session log.
window.__ModuleLoader__.load({
  id: "@appwithai/chat-business-nodes",
  factory: (require) => {
    const module = { exports: {} };
    const React = require("react");
    const h = React.createElement;
    const { useEffect, useRef, useState, useCallback } = React;

    const APPLICATION_TOOLS = ["open_record", "open_create_form", "open_update_form", "request_approval"];
    const REPORT_TOOL = "run_approved_report";
    const MESSAGE_SOURCE = "appwithai-app";
    const SAVED = "record-saved";

    /** The chat's root: the directory the Harness index was served from (`<base href="./">`). */
    const chatRoot = () => new URL("./", document.baseURI);
    const viewUrl = (id, action, query) => {
      const url = new URL(`_/views/${encodeURIComponent(id)}/${action}`, chatRoot());
      if (query) for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
      return url.href;
    };

    async function postJson(url, body) {
      const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `The chat refused the request (${response.status}).`);
      return payload;
    }

    const styles = {
      card: {
        border: "1px solid var(--dsw-alias-separator-primary, rgba(127,127,127,.25))",
        borderRadius: 10,
        overflow: "hidden",
        margin: "6px 0",
        background: "var(--dsw-alias-background-primary, transparent)",
      },
      head: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderBottom: "1px solid var(--dsw-alias-separator-primary, rgba(127,127,127,.25))",
        fontSize: 13,
      },
      title: { fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      badge: {
        fontSize: 11,
        padding: "1px 8px",
        borderRadius: 999,
        border: "1px solid var(--dsw-alias-separator-primary, rgba(127,127,127,.35))",
        color: "var(--dsw-alias-label-secondary, inherit)",
      },
      button: {
        fontSize: 12,
        padding: "3px 10px",
        borderRadius: 6,
        border: "1px solid var(--dsw-alias-separator-primary, rgba(127,127,127,.35))",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        textDecoration: "none",
      },
      frame: { display: "block", width: "100%", height: "70vh", border: 0, background: "#fff" },
      note: { padding: "8px 12px", fontSize: 13, color: "var(--dsw-alias-label-secondary, inherit)" },
      error: { padding: "8px 12px", fontSize: 13, color: "var(--dsw-alias-label-danger, #b42318)" },
      table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
      cell: { textAlign: "left", padding: "4px 8px", borderBottom: "1px solid var(--dsw-alias-separator-primary, rgba(127,127,127,.2))", whiteSpace: "nowrap" },
    };

    const OPERATION_LABEL = { view: "View", create: "New", update: "Edit", transition: "Approval" };

    const textOf = (block) =>
      (block.content || [])
        .filter((part) => part && part.type === "text")
        .map((part) => part.text)
        .join("\n");

    function Pending({ label }) {
      return h("div", { style: styles.card }, h("div", { style: styles.note }, label));
    }

    function Failure({ block }) {
      return h("div", { style: styles.card }, h("div", { style: styles.error }, textOf(block) || "The tool failed."));
    }

    /** Add a gateway-verified notice to the conversation without trampling the person's draft. */
    function useNotice(useInput, inputActions) {
      const input = useInput ? useInput((state) => state) : null;
      const [held, setHeld] = useState(null);
      const deliver = useCallback(
        (notice) => {
          const text = `[Application] ${notice}`;
          if (inputActions && input && input.phase === "plain" && !input.draft.trim()) {
            inputActions.setDraft(text);
            inputActions.submit();
            setHeld(null);
          } else {
            setHeld(text);
          }
        },
        [input, inputActions]
      );
      const insertHeld = useCallback(() => {
        if (held && inputActions) {
          inputActions.setDraft(held);
          setHeld(null);
        }
      }, [held, inputActions]);
      return { deliver, held, insertHeld };
    }

    function ApplicationCard(props) {
      const { phase, block, useInput, inputActions } = props;
      const meta = phase === "result" ? block.meta : null;
      // The card renders first while the tool is still running, with no meta;
      // the view id arrives with the result. So the id is read from the result
      // on every render, and state holds only a replacement minted by Re-open —
      // state initialised from the first render would keep the pending `null`.
      const [reopened, setReopened] = useState(null);
      const viewId = reopened || (meta && meta.applicationViewId) || null;
      const expired = !reopened && meta ? Date.parse(meta.expiresAt) < Date.now() : false;
      const [problem, setProblem] = useState(null);
      const [saved, setSaved] = useState([]);
      const frame = useRef(null);
      const { deliver, held, insertHeld } = useNotice(useInput, inputActions);

      useEffect(() => {
        if (!viewId) return undefined;
        const onMessage = async (event) => {
          // Only this card's own frame, only this origin, only the contract's shape.
          if (!frame.current || event.source !== frame.current.contentWindow) return;
          if (event.origin !== window.location.origin) return;
          const data = event.data;
          if (!data || data.source !== MESSAGE_SOURCE || data.v !== 1 || data.type !== SAVED) return;
          if (typeof data.id !== "string") return;
          try {
            const answer = await postJson(viewUrl(viewId, "saved"), { id: data.id, operation: data.operation });
            setSaved((list) => [...list, answer.notice]);
            deliver(answer.notice);
          } catch (error) {
            setProblem(error.message);
          }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
      }, [viewId, deliver]);

      if (phase !== "result") return h(Pending, { label: "Opening the application…" });
      if (block.isError || !meta || meta.type !== "business-application") return h(Failure, { block });

      const reopen = async () => {
        setProblem(null);
        try {
          const answer = await postJson(viewUrl(viewId, "reopen"));
          setReopened(answer.viewId);
        } catch (error) {
          setProblem(error.message);
        }
      };

      return h(
        "div",
        { style: styles.card, "data-business-card": "application" },
        h(
          "div",
          { style: styles.head },
          h("span", { style: styles.badge }, OPERATION_LABEL[meta.operation] || meta.operation),
          h("span", { style: styles.title, title: meta.title }, meta.title),
          expired
            ? null
            : h("a", { style: styles.button, href: viewUrl(viewId, "open"), target: "_blank", rel: "noopener noreferrer" }, "Open in a tab"),
          h("button", { style: styles.button, type: "button", onClick: reopen }, "Re-open")
        ),
        expired
          ? h("div", { style: styles.note }, "This view has expired. Re-open it to continue.")
          : h("iframe", {
              ref: frame,
              key: viewId,
              title: meta.title,
              src: viewUrl(viewId, "open"),
              style: styles.frame,
              sandbox: "allow-forms allow-scripts allow-same-origin allow-downloads allow-popups",
              referrerPolicy: "no-referrer",
            }),
        saved.map((notice, index) => h("div", { key: index, style: styles.note }, notice)),
        held
          ? h(
              "div",
              { style: styles.note },
              "Saved — ",
              h("button", { style: styles.button, type: "button", onClick: insertHeld }, "Tell the assistant")
            )
          : null,
        problem ? h("div", { style: styles.error }, problem) : null
      );
    }

    function ReportCard(props) {
      const { phase, block } = props;
      const meta = phase === "result" ? block.meta : null;
      const [reopened, setReopened] = useState(null);
      const viewId = reopened || (meta && meta.reportViewId) || null;
      const [page, setPage] = useState(0);
      const [data, setData] = useState(null);
      const [problem, setProblem] = useState(null);
      const [showPage, setShowPage] = useState(false);
      const pageSize = 25;

      useEffect(() => {
        if (!viewId) return undefined;
        let cancelled = false;
        setProblem(null);
        fetch(viewUrl(viewId, "rows", { page, pageSize }), { credentials: "same-origin" })
          .then(async (response) => {
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.message || `The report could not be loaded (${response.status}).`);
            if (!cancelled) setData(body);
          })
          .catch((error) => {
            if (!cancelled) setProblem(error.message);
          });
        return () => {
          cancelled = true;
        };
      }, [viewId, page]);

      if (phase !== "result") return h(Pending, { label: "Running the report…" });
      if (block.isError || !meta || meta.type !== "enterprise-report") return h(Failure, { block });

      const reopen = async () => {
        try {
          const answer = await postJson(viewUrl(viewId, "reopen"));
          setReopened(answer.viewId);
          setPage(0);
        } catch (error) {
          setProblem(error.message);
        }
      };

      const rows = data ? data.rows : [];
      const columns = rows.length ? Object.keys(rows[0]) : [];
      const total = data ? data.totalRows : 0;
      const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);

      return h(
        "div",
        { style: styles.card, "data-business-card": "report" },
        h(
          "div",
          { style: styles.head },
          h("span", { style: styles.badge }, "Report"),
          h("span", { style: styles.title, title: meta.title }, meta.title),
          ["csv", "xlsx", "pdf"].map((format) =>
            h("a", { key: format, style: styles.button, href: viewUrl(viewId, "export", { format }), download: "" }, format.toUpperCase())
          ),
          h(
            "button",
            { style: styles.button, type: "button", onClick: () => setShowPage((open) => !open) },
            showPage ? "Hide report page" : meta.hasChart ? "Chart and report page" : "Report page"
          ),
          h("button", { style: styles.button, type: "button", onClick: reopen }, "Re-open")
        ),
        problem ? h("div", { style: styles.error }, problem) : null,
        showPage
          ? h("iframe", {
              key: `page-${viewId}`,
              title: meta.title,
              src: viewUrl(viewId, "open"),
              style: styles.frame,
              sandbox: "allow-forms allow-scripts allow-same-origin allow-downloads",
              referrerPolicy: "no-referrer",
            })
          : null,
        data
          ? h(
              "div",
              { style: { overflowX: "auto" } },
              h(
                "table",
                { style: styles.table },
                h("thead", null, h("tr", null, columns.map((column) => h("th", { key: column, style: styles.cell }, column)))),
                h(
                  "tbody",
                  null,
                  rows.map((row, index) =>
                    h(
                      "tr",
                      { key: index },
                      columns.map((column) =>
                        h("td", { key: column, style: styles.cell }, row[column] === null || row[column] === undefined ? "—" : String(row[column]))
                      )
                    )
                  )
                )
              )
            )
          : h("div", { style: styles.note }, "Loading…"),
        h(
          "div",
          { style: { ...styles.head, borderBottom: 0, borderTop: "1px solid var(--dsw-alias-separator-primary, rgba(127,127,127,.25))" } },
          h("span", { style: { flex: 1 } }, `${total} row(s) · page ${page + 1} of ${lastPage + 1}`),
          h("button", { style: styles.button, type: "button", disabled: page === 0, onClick: () => setPage((p) => Math.max(0, p - 1)) }, "Previous"),
          h("button", { style: styles.button, type: "button", disabled: page >= lastPage, onClick: () => setPage((p) => p + 1) }, "Next")
        )
      );
    }

    const inject = ["slots"];
    function apply(ctx) {
      for (const key of APPLICATION_TOOLS) {
        ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({ name: "tool.call.toolview", key }, ApplicationCard));
      }
      ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({ name: "tool.call.toolview", key: REPORT_TOOL }, ReportCard));
    }

    module.exports.apply = apply;
    module.exports.inject = inject;
    module.exports.name = "chat-business-nodes";
    return module.exports;
  },
});
