# VS Code Setup Guide for Awesome Copilot MCP Bundle

This guide walks through configuring the Awesome Copilot MCP server in VS Code.

## Prerequisites

- **VS Code** v1.90 or later (or VS Code Insiders)
- **Node.js** v18.0.0 or higher (already installed)
- **MCP Extension** (optional but recommended for better UX)

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/username/awesome-copilot-mcp.git
cd awesome-copilot-mcp
npm install
```

This creates a `build/index.js` file that the MCP server will run.

### Step 2: Locate Your MCP Configuration File

VS Code stores MCP server configuration in a special file location (not in settings.json).

**Location by platform:**
- **Windows**: `%APPDATA%\Code - Insiders\User\mcp.json` (or `Code\User\mcp.json` for stable VS Code)
- **macOS**: `~/Library/Application Support/Code - Insiders/User/mcp.json`
- **Linux**: `~/.config/Code - Insiders/User/mcp.json`

**To find your file quickly:**
1. Open VS Code
2. Press Ctrl+Shift+P (Cmd+Shift+P on macOS)
3. Type "Preferences: Open User Settings (JSON)"
4. Navigate to the folder shown in the title bar
5. Look for `mcp.json` in that directory

### Step 3: Edit the MCP Configuration

1. Open your `mcp.json` file (create it if it doesn't exist)
2. Add the awesome-copilot server configuration:

```jsonc
{
  "servers": {
    "awesome-copilot": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Users\\YourUsername\\path\\to\\awesome-copilot-mcp\\build\\index.js"
      ]
    }
  }
}
```

**Replace:**
- `C:\\Users\\YourUsername\\path\\to\\` with your actual path to the cloned repository

**Example on Windows:**
```
"C:\\Users\\johndoe\\Documents\\awesome-copilot-mcp\\build\\index.js"
```

**On macOS/Linux:**
```json
{
  "servers": {
    "awesome-copilot": {
      "command": "node",
      "args": [
        "/Users/yourusername/path/to/awesome-copilot-mcp/build/index.js"
      ]
    }
  }
}
```

### Step 4: Verify Installation

1. Save the `mcp.json` file
2. Reload VS Code (Ctrl+R or Cmd+R)
3. Open the MCP panel or check VS Code output
4. You should see "awesome-copilot" listed as an active server

### Step 5: Test the Connection

**Method 1: Using VS Code Output Panel**
1. Open Output panel (View → Output)
2. Select "MCP" from the dropdown
3. You should see connection logs

**Method 2: Using Terminal**

On Windows:
```bash
"C:\Program Files\nodejs\node.exe" "C:\Users\YourUsername\path\to\awesome-copilot-mcp\build\index.js"
```

On macOS/Linux:
```bash
node /Users/yourusername/path/to/awesome-copilot-mcp/build/index.js
```

You should see: `Awesome Copilot MCP server running on stdio`

## Finding Your Repository Path

To find the full path to your cloned repository:

**Windows (PowerShell):**
```powershell
# Navigate to your repository folder
cd C:\Users\YourUsername\Documents\awesome-copilot-mcp
pwd  # Shows the full path
```

**macOS/Linux (Terminal):**
```bash
# Navigate to your repository folder
cd ~/awesome-copilot-mcp
pwd  # Shows the full path
```

Use the output from `pwd` in your mcp.json configuration.

## Using with GitHub Copilot Chat (Optional)

VS Code Insiders comes with built-in GitHub Copilot MCP integration. You can reference Awesome Copilot instructions through the `search_instructions` tool to enhance code generation.

**To use via the MCP tool:**
1. In GitHub Copilot Chat, ask it to search for instructions
2. Reference the tool: "Use the search_instructions tool to find React best practices"
3. The MCP server will search and return relevant content

## Troubleshooting

### Server Won't Connect

1. **Check Node.js:**
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **Verify the path exists:**
   ```powershell
   Test-Path "c:\Users\YourUsername\AppData\Roaming\Claude\mcpb\build\index.js"
   ```

3. **Check VS Code Output:**
   - View → Output
   - Select "MCP" from dropdown
   - Look for connection errors

4. **Verify mcp.json syntax:**
   - Make sure the JSON is valid (use an online JSON validator)
   - Check file location is correct
   - Ensure `mcp.json` is in the User folder, not workspace folder

### Tools Not Appearing

- Make sure the bundle directory contains the `instructions/`, `prompts/`, `chatmodes/`, and `agents/` subdirectories
- Reload VS Code (Ctrl+R)
- Check that the server is listed in the MCP panel

### Path Issues on Windows

- Always use double backslashes: `c:\\Users\\YourUsername\\...`
- Or use forward slashes: `c:/Users/YourUsername/...`
- Avoid spaces in paths or wrap in quotes

### File Location Issues

- VS Code stores MCP config in `Code - Insiders` folder (not `Code` if using stable)
- Make sure `mcp.json` is in: `%APPDATA%\Code - Insiders\User\`
- If the file doesn't exist, create it manually

## Using the MCP Tools

Once connected, you can interact with the Awesome Copilot MCP tools:

### Search Instructions
```
Tool: search_instructions
Input: keywords = "python best practices"
Output: List of matching instructions with titles and descriptions
```

### Load Instruction
```
Tool: load_instruction
Input: mode = "instructions", filename = "python-best-practices.instructions.md"
Output: Full content of the instruction file
```

### List Files
```
Tool: list_files
Input: mode = "instructions"
Output: All available instruction files with metadata
```

## Alternative: Manual Server Startup

If you prefer to run the server manually:

1. Open a terminal in VS Code
2. Navigate to the bundle directory:
   ```bash
   cd c:\Users\YourUsername\AppData\Roaming\Claude\mcpb\build
   ```
3. Start the server:
   ```bash
   node index.js
   ```

The server will run and accept MCP requests over stdio.

## Next Steps

- Explore the `search_instructions` tool to find relevant agents, prompts, and instructions
- Load specific files to see their full content
- Integrate the instructions with GitHub Copilot Chat for better code generation

## Support

For issues or questions:
- Check the main [Awesome Copilot repository](https://github.com/github/awesome-copilot)
- Review MCP extension documentation
- Check VS Code's MCP server logs (View → Output → "MCP")
