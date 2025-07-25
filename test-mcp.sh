#!/bin/bash

echo "Testing Figma MCP Server..."
echo "Node.js version: $(node --version)"
echo "NPX version: $(npx --version)"
echo ""

echo "Testing figma-developer-mcp package..."
npx -y figma-developer-mcp --version

echo ""
echo "Testing MCP server startup (will timeout after 10 seconds)..."
echo "Press Ctrl+C if it hangs..."

# Test the exact command from mcp.json
exec npx -y figma-developer-mcp --figma-api-key=YOUR_FIGMA_TOKEN_HERE --stdio
