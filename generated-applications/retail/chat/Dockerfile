# The chat gateway and the Harness hosts it starts, in one image.
#
# Two runtimes, each for its own job: Bun runs the gateway (`gateway/server.ts`)
# and installs the dependencies from `bun.lock`; Node runs each person's
# Harness host, because DeepSeek Harness requires Node 22.19 or later. Bun is
# copied in from its own image at the version the lockfile was written with,
# rather than installed by a script fetched at build time.
FROM oven/bun:1.3.14-debian AS bun

FROM node:22-bookworm-slim
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /chat

# Manifests first, so a source change does not reinstall. The two plugins are
# workspace packages and the install needs their manifests to link them.
COPY package.json bun.lock bunfig.toml ./
COPY plugins/business-tools/package.json plugins/business-tools/
COPY plugins/business-nodes/package.json plugins/business-nodes/
# Harness's own install scripts stay blocked, as in development: the lockfile
# is the dependency set, and nothing fetched at install time joins it.
RUN bun install --frozen-lockfile --production

COPY gateway gateway
COPY plugins plugins
COPY profile profile
COPY skills skills
COPY AGENTS.md tsconfig.json ./

# Host homes, session logs and documents. Mount a volume here: a person's
# conversations live in it.
ENV CHAT_DATA_DIR=/chat/.data
RUN mkdir -p /chat/.data && chown -R node:node /chat/.data
USER node

EXPOSE 3100
CMD ["bun", "gateway/server.ts"]
