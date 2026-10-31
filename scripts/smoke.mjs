// Starts the bundled build/index.js over MCP stdio, exactly as an MCP client
// does, and checks it works. Type-check and vitest run the TypeScript sources,
// so they can't see failures that only exist in the bundle. Run after `npm run build`.
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const SENSITIVE = [
  "monzo_deposit_into_pot",
  "monzo_withdraw_from_pot",
  "monzo_register_webhook",
  "monzo_create_feed_item",
];
const failures = [];
const check = (ok, message) => ok || failures.push(message);

const runtimeDeps = Object.keys(pkg.dependencies ?? {});
check(
  runtimeDeps.length === 0,
  `package.json has runtime dependencies (${runtimeDeps.join(", ")}); they belong in the bundle`
);

async function listTools(env) {
  const client = new Client({ name: "smoke", version: "0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: ["build/index.js"],
      // A dummy token: listing tools makes no API calls.
      env: { PATH: process.env.PATH ?? "", MONZO_ACCESS_TOKEN: "smoke-test", ...env },
      stderr: "ignore",
    })
  );
  const info = client.getServerVersion();
  const { tools } = await client.listTools();
  await client.close();
  return { info, tools };
}

const { info, tools } = await listTools({});
check(info?.version === pkg.version, `server reports version ${info?.version}, package.json says ${pkg.version}`);
check(tools.length === 15, `expected 15 tools by default, got ${tools.length}`);
check(tools.every((t) => t.annotations), "a tool is missing its annotations");
for (const name of SENSITIVE) check(!tools.some((t) => t.name === name), `${name} is exposed by default`);

const opted = await listTools({ MONZO_ENABLE_SENSITIVE_TOOLS: "true" });
check(
  opted.tools.length === tools.length + SENSITIVE.length,
  `with sensitive tools on, expected ${tools.length + SENSITIVE.length} tools, got ${opted.tools.length}`
);

if (failures.length) {
  console.error(`Smoke test failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`Smoke test passed: ${info.name} ${info.version}, ${tools.length} tools (${opted.tools.length} with sensitive tools on)`);
