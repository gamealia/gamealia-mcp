// Starts the server over stdio and checks that it answers initialize and lists its tools.
import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["dist/gamealia-mcp.mjs"], { stdio: ["pipe", "pipe", "inherit"] });
const send = (msg) => child.stdin.write(JSON.stringify(msg) + "\n");
let buf = "";
const timer = setTimeout(() => { console.error("timeout"); child.kill(); process.exit(1); }, 20000);
child.stdout.on("data", (d) => {
  buf += d;
  for (const line of buf.split("\n").slice(0, -1)) {
    const msg = JSON.parse(line);
    if (msg.id === 2) {
      const tools = msg.result?.tools ?? [];
      const missing = tools.flatMap((t) => Object.entries(t.inputSchema?.properties ?? {}).filter(([, p]) => !p.description).map(([k]) => `${t.name}.${k}`));
      console.log(`${tools.length} tools`);
      if (missing.length) console.log(`parameters without description: ${missing.join(", ")}`);
      clearTimeout(timer); child.kill();
      process.exit(tools.length > 0 ? 0 : 1);
    }
  }
  buf = buf.slice(buf.lastIndexOf("\n") + 1);
});
send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "1" } } });
send({ jsonrpc: "2.0", method: "notifications/initialized" });
send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
