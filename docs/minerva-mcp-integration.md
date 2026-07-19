# Minerva MCP Server — OpenCode Integration

Minerva (Process Intelligence backend) is exposed to OpenCode as a remote MCP server.
Once configured, every OpenCode agent can call Minerva's 11 process-intelligence tools
(prefixed `minerva_*`) alongside built-in tools.

## Status (THE-247)

- Server: `Minerva MCP Server` v0.21.0, reachable at `http://localhost:8002/mcp`
- Transport: Streamable HTTP (OpenCode `type: "remote"`)
- Tenant: `the_software_company`
- Tools exposed: **11** (verified `2026-07-19` via `opencode mcp list` → `minerva connected`)
- Auth: API-key bearer token + `X-Tenant-Id` header (no OAuth)

## Configuration

Registered in the OpenCode global config (`~/.config/opencode/opencode.json` and the
active session config). The secret is referenced via an env var, never hardcoded:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "minerva": {
      "type": "remote",
      "url": "http://localhost:8002/mcp",
      "oauth": false,
      "enabled": true,
      "headers": {
        "X-Tenant-Id": "the_software_company",
        "Authorization": "Bearer {env:MINERVA_API_KEY}"
      }
    }
  }
}
```

## Authentication (secret handling)

`MINERVA_API_KEY` must be present in the environment of any OpenCode process that uses
Minerva. The key is the Minerva service's `MINERVA_API_KEY` / `PAPERCLIP_API_KEY`
(local dev key, `mk_…` prefix) and lives only in the Minerva service runtime — it is
**not** stored in git, the OpenCode config, or the Paperclip secret store.

To make it available for a session:

```bash
export MINERVA_API_KEY="$(tr '\0' '\n' < /proc/$(pgrep -f 'uvicorn.*8002')/environ | grep '^MINERVA_API_KEY=' | cut -d= -f2-)"
```

For persistent use, add the export to the shell profile / agent runtime env so the
Minerva MCP tools are available without manual setup.

## Available tools (11)

| Tool | Purpose |
|------|---------|
| `get_process_evidence` | Retrieve process evidence for a case/run |
| `compare_processes` | Compare two processes |
| `get_gold_standard` | Fetch the reference/gold-standard process model |
| `get_variants` | List process variants |
| `get_quality_scores` | Process quality scores |
| `get_quality_trends` | Quality trends over time |
| `get_recommendations` | Improvement recommendations |
| `create_optimization_plan` | Draft an optimization plan |
| `record_action` | Record a process action taken |
| `record_impact` | Record measured impact of an action |
| `get_action_history` | History of recorded actions/impacts |

## Usage

Prompt any agent with `use the minerva tool` (or reference a specific `minerva_*`
tool). The Minerva agent (researcher) is the primary consumer for process-intelligence
analysis; CTO/CEO can query process metrics directly.

## Verification

```bash
export MINERVA_API_KEY=...
opencode mcp list   # expect: ● ✓ minerva  connected  http://localhost:8002/mcp
```

If the server is unreachable, confirm the Minerva backend is running on `:8002`
(`curl -s http://localhost:8002/health` → 200) and that `MINERVA_API_KEY` is exported.
