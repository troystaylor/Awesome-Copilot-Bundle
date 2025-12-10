#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Repository root is one level up from server directory
const REPO_ROOT = path.join(__dirname, "..");

// Directories containing the different types of content
const DIRECTORIES = {
  instructions: path.join(REPO_ROOT, "instructions"),
  prompts: path.join(REPO_ROOT, "prompts"),
  collections: path.join(REPO_ROOT, "collections"),
  agents: path.join(REPO_ROOT, "agents"),
};

// Backwards compatibility aliases
const MODE_ALIASES = {
  chatmodes: "collections",
};

const SUPPORTED_EXTENSIONS = [".md", ".yml", ".yaml"];

function resolveMode(mode) {
  return MODE_ALIASES[mode] || mode;
}

/**
 * Extract frontmatter from markdown file
 */
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content };
  }

  const frontmatterText = match[1];
  const remainingContent = content.slice(match[0].length);

  // Parse simple YAML frontmatter
  const frontmatter = {};
  const lines = frontmatterText.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, "");
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: remainingContent };
}

function parseMetadata(file, content) {
  const ext = path.extname(file).toLowerCase();

  if (ext === ".yml" || ext === ".yaml") {
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const descriptionMatch = content.match(/^description:\s*(.+)$/m);

    return {
      title: nameMatch ? nameMatch[1].trim().replace(/^['"]|['"]$/g, "") : file,
      description: descriptionMatch ? descriptionMatch[1].trim().replace(/^['"]|['"]$/g, "") : "",
      mode: undefined,
    };
  }

  const { frontmatter } = extractFrontmatter(content);
  const defaultTitle = file.replace(/\.(instructions|prompt|chatmode|agent|collection)\.(md|ya?ml)$/i, "");

  return {
    title: frontmatter.title || defaultTitle,
    description: frontmatter.description || "",
    mode: frontmatter.mode || undefined,
  };
}

/**
 * Search for files in all directories based on keywords
 */
async function searchInstructions(keywords) {
  const results = [];
  const searchTerms = keywords.toLowerCase().split(/\s+/);

  for (const [type, dirPath] of Object.entries(DIRECTORIES)) {
    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

        const filePath = path.join(dirPath, file);
        const content = await fs.readFile(filePath, "utf-8");
        const metadata = parseMetadata(file, content);

        // Search in filename, description, and content
        const searchText = `${file} ${metadata.description || ""} ${content}`.toLowerCase();

        // Check if any search term matches
        const matches = searchTerms.some((term) => searchText.includes(term));

        if (matches) {
          results.push({
            type,
            filename: file,
            title: metadata.title,
            description: metadata.description,
            mode: metadata.mode,
          });
        }
      }
    } catch (error) {
      // Directory might not exist, skip it
      console.error(`Error reading directory ${dirPath}:`, error.message);
    }
  }

  return results;
}

/**
 * Load a specific instruction file
 */
async function loadInstruction(mode, filename) {
  const resolvedMode = resolveMode(mode);
  const dirPath = DIRECTORIES[resolvedMode];

  if (!dirPath) {
    throw new Error(
      `Invalid mode: ${mode}. Must be one of: instructions, prompts, collections (or chatmodes), agents`
    );
  }

  const filePath = path.join(dirPath, filename);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    throw new Error(`Failed to load file ${filename} from ${mode}: ${error.message}`);
  }
}

/**
 * Get all available files for a specific mode
 */
async function listFiles(mode) {
  const resolvedMode = resolveMode(mode);
  const dirPath = DIRECTORIES[resolvedMode];

  if (!dirPath) {
    throw new Error(
      `Invalid mode: ${mode}. Must be one of: instructions, prompts, collections (or chatmodes), agents`
    );
  }

  try {
    const files = await fs.readdir(dirPath);
    const results = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

      const filePath = path.join(dirPath, file);
      const content = await fs.readFile(filePath, "utf-8");
      const metadata = parseMetadata(file, content);

      results.push({
        filename: file,
        title: metadata.title,
        description: metadata.description,
      });
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to list files from ${mode}: ${error.message}`);
  }
}

// Create MCP server
const server = new Server(
  {
    name: "awesome-copilot",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_instructions",
        description:
          "Search for GitHub Copilot customizations (instructions, prompts, collections, agents) based on keywords. Returns a list of matching items with their type, filename, title, and description.",
        inputSchema: {
          type: "object",
          properties: {
            keywords: {
              type: "string",
              description: "Keywords to search for in titles, descriptions, and content",
            },
          },
          required: ["keywords"],
        },
      },
      {
        name: "load_instruction",
        description:
          "Load the complete content of a specific instruction, prompt, collection, or agent file from the awesome-copilot repository.",
        inputSchema: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["instructions", "prompts", "collections", "chatmodes", "agents"],
              description: "The type of content to load",
            },
            filename: {
              type: "string",
              description: "The filename to load (e.g., 'python-django.instructions.md')",
            },
          },
          required: ["mode", "filename"],
        },
      },
      {
        name: "list_files",
        description:
          "List all available files for a specific mode (instructions, prompts, collections, or agents).",
        inputSchema: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["instructions", "prompts", "collections", "chatmodes", "agents"],
              description: "The type of content to list",
            },
          },
          required: ["mode"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_instructions") {
      const results = await searchInstructions(args.keywords);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    if (name === "load_instruction") {
      const content = await loadInstruction(args.mode, args.filename);
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    }

    if (name === "list_files") {
      const files = await listFiles(args.mode);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(files, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Register prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "search_prompt",
        description: "Get a prompt template for searching copilot instructions with specific keywords",
        arguments: [
          {
            name: "keyword",
            description: "The keyword to search for",
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search_prompt") {
    const keyword = args?.keyword || "{keyword}";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please search all the collections, instructions, prompts, and agents that are related to the search keyword, "${keyword}".

Here's the process to follow:

1. Use the 'awesome-copilot' MCP server.
2. Search all collections, instructions, prompts, and agents for the keyword provided.
3. DO NOT load any collections, instructions, prompts, or agents from the MCP server until the user asks to do so.
4. Scan local collections, instructions, prompts, and agents files in .github/collections, .github/instructions, .github/prompts, and .github/agents directories respectively.
5. Compare existing collections, instructions, prompts, and agents with the search results.
6. Provide a structured response in a table format that includes the already exists, mode (collections, instructions, prompts or agents), filename, title and description of each item found. Here's an example of the table format:

| Exists | Mode         | Filename                      | Title         | Description   |
|--------|--------------|-------------------------------|---------------|-----------------|
| ✅     | collections  | awesome-collection.collection.yml | My Collection | Description 1 |
| ❌     | instructions | instruction1.instructions.md  | Instruction 1 | Description 1 |
| ✅     | prompts      | prompt1.prompt.md             | Prompt 1      | Description 1 |
| ❌     | agents       | agent1.agent.md               | Agent 1       | Description 1 |

✅ indicates that the item already exists in this repository, while ❌ indicates that it does not.

7. If any item doesn't exist in the repository, ask which item the user wants to save.
8. If the user wants to save it, save the item in the appropriate directory (.github/collections, .github/instructions, .github/prompts, or .github/agents) using the mode and filename, with NO modification.`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Awesome Copilot MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
