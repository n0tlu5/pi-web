import fs from "node:fs";
import path from "node:path";

console.log("[setup-omo] Setting up OmO plugin and patches...");

const omoPluginSource = "/usr/local/lib/node_modules/omo-ai/plugin";
const targetPlugin = "/opt/omo-plugin";
if (fs.existsSync(omoPluginSource)) {
  fs.cpSync(omoPluginSource, targetPlugin, { recursive: true });
  console.log("[setup-omo] Copied plugin to /opt/omo-plugin");
} else {
  console.error("[setup-omo] Error: omo-ai plugin not found at", omoPluginSource);
  process.exit(1);
}

const pkgPath = path.join(targetPlugin, "package.json");
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.pi = pkg.pi || {};
  pkg.pi.skills = ["./skills"];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
  console.log("[setup-omo] Added skills to /opt/omo-plugin/package.json");
}

function findAndPatchFiles(dir, matchStr, replaceFn) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".js")) {
      const fullPath = path.join(entry.parentPath || dir, entry.name);
      try {
        let content = fs.readFileSync(fullPath, "utf8");
        if (content.includes(matchStr)) {
          content = replaceFn(content);
          fs.writeFileSync(fullPath, content, "utf8");
          console.log("[setup-omo] Patched", fullPath);
        }
      } catch (e) {}
    }
  }
}

const omoExtPath = path.join(targetPlugin, "extensions", "omo.js");
if (fs.existsSync(omoExtPath)) {
  let s = fs.readFileSync(omoExtPath, "utf8");
  const oldCode = 'Object(e){let t=Object.entries(e).filter(([,e])=>!("optional"in e)).map(([e])=>e);return{type:"object",properties:e,required:t}}';
  const newCode = 'Object(e){let t=Object.entries(e).filter(([,e])=>!("optional"in e)).map(([e])=>e);let p=Object.fromEntries(Object.entries(e).map(([k,v])=>{const{optional,...r}=v;return[k,r]}));return{type:"object",properties:p,required:t}}';
  if (s.includes(oldCode)) {
    s = s.replace(oldCode, newCode);
    fs.writeFileSync(omoExtPath, s, "utf8");
    console.log("[setup-omo] Patched Object(e) in omo.js");
  } else {
    console.warn("[setup-omo] Warning: Object(e) signature not matched in omo.js");
  }
}

findAndPatchFiles(
  "/usr/local/lib/node_modules",
  'const MCP_EXPOSURE_ALIASES = { "codemode-deferred": "codemode" };',
  (c) => c.replace(
    'const MCP_EXPOSURE_ALIASES = { "codemode-deferred": "codemode" };',
    'const MCP_EXPOSURE_ALIASES = { "search": "deferred", "codemode-deferred": "codemode" };'
  )
);

findAndPatchFiles(
  "/usr/local/lib/node_modules",
  'MCP_EXPOSURE_ALIASES={"codemode-deferred":"codemode"}',
  (c) => c.replace(
    'MCP_EXPOSURE_ALIASES={"codemode-deferred":"codemode"}',
    'MCP_EXPOSURE_ALIASES={"search":"deferred","codemode-deferred":"codemode"}'
  )
);

findAndPatchFiles(
  "/usr/local/lib/node_modules",
  'if (value.auth !== undefined) {',
  (c) => c.replace(
    'if (value.auth !== undefined) {',
    'if (value.auth === false || typeof value.auth === "string") delete value.auth; if (value.auth !== undefined) {'
  )
);

findAndPatchFiles(
  "/usr/local/lib/node_modules",
  'if(value.auth!==void 0){',
  (c) => c.replace(
    'if(value.auth!==void 0){',
    'if(value.auth===false||value.auth==="bearer")delete value.auth;if(value.auth!==void 0){'
  )
);

const cleanJsonSchemaDef = `function cleanJsonSchema(s){if(!s||typeof s!=="object")return s;if(Array.isArray(s))return s.map(cleanJsonSchema);const c={...s};delete c.optional;for(const k of Object.keys(c))c[k]=cleanJsonSchema(c[k]);return c;}\n`;

findAndPatchFiles(
  "/usr/local/lib/node_modules",
  'export function getJsonSchemaToolParameters(tool, strict) {',
  (c) => {
    let res = c;
    if (!res.includes("function cleanJsonSchema(")) {
      res = cleanJsonSchemaDef + res;
    }
    return res.replace(
      'return (strict === true ? makeStrictJsonSchema(tool.parameters) : tool.parameters);',
      'return cleanJsonSchema(strict === true ? makeStrictJsonSchema(tool.parameters) : tool.parameters);'
    );
  }
);

findAndPatchFiles(
  "/usr/local/lib/node_modules",
  'function getJsonSchemaToolParameters(tool,strict){return strict===!0?makeStrictJsonSchema(tool.parameters):tool.parameters}',
  (c) => c.replace(
    'function getJsonSchemaToolParameters(tool,strict){return strict===!0?makeStrictJsonSchema(tool.parameters):tool.parameters}',
    'function cleanJsonSchema(s){if(!s||typeof s!=="object")return s;if(Array.isArray(s))return s.map(cleanJsonSchema);const c={...s};delete c.optional;for(const k of Object.keys(c))c[k]=cleanJsonSchema(c[k]);return c;}\nfunction getJsonSchemaToolParameters(tool,strict){return cleanJsonSchema(strict===!0?makeStrictJsonSchema(tool.parameters):tool.parameters)}'
  )
);

findAndPatchFiles(
  "/usr/local/lib/node_modules",
  'throw new Error("Freeform tools cannot be sent to OpenAI Chat Completions; use Responses API");',
  (c) => c.replace(
    'throw new Error("Freeform tools cannot be sent to OpenAI Chat Completions; use Responses API");',
    'delete tool.freeform;'
  )
);

console.log("[setup-omo] Setup and patches completed successfully!");
