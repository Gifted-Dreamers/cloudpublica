#!/usr/bin/env node

/**
 * HTTP MCP Server for LinkStack
 * 
 * This server exposes the LinkStack MCP server over HTTP using SSE (Server-Sent Events)
 * Compatible with mcp-remote client
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import Database from 'better-sqlite3';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();

const DB_PATH = process.env.LINKSTACK_DB_PATH || process.env.LINKSTACK_DB;
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.LINKSTACK_MCP_API_KEY;

if (!DB_PATH) {
  console.error('ERROR: LINKSTACK_DB_PATH environment variable is required');
  process.exit(1);
}

if (!API_KEY) {
  console.error('ERROR: LINKSTACK_MCP_API_KEY environment variable is required');
  console.error('       The API key should be set at deployment time (e.g., in Docker environment)');
  console.error('       Clients fetch the API key from 1Password and pass it in Authorization header');
  process.exit(1);
}

let db;
try {
  db = new Database(DB_PATH, { readonly: false });
  console.error(`[LinkStack MCP HTTP] Connected to database: ${DB_PATH}`);
} catch (error) {
  console.error(`[LinkStack MCP HTTP] Failed to connect to database: ${error.message}`);
  process.exit(1);
}

// Initialize MCP server
const mcpServer = new McpServer(
  {
    name: 'linkstack-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to get user by email
function getUserByEmail(email) {
  try {
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);
    return user;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
}

// Helper function to get link by ID
function getLinkById(linkId) {
  try {
    const link = db.prepare('SELECT * FROM links WHERE id = ?').get(linkId);
    return link;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
}

// Register tools
mcpServer.tool(
  'list_links',
  'List all links for a user by their email address',
  {
    type: 'object',
    properties: {
      user_email: {
        type: 'string',
        description: 'User email address (e.g., user@commoncloud.cc)',
      },
    },
    required: ['user_email'],
  },
  async (args) => {
    const { user_email } = args;
    const user = getUserByEmail(user_email);
    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: `User not found: ${user_email}`,
          },
        ],
      };
    }
    const links = db
      .prepare('SELECT * FROM links WHERE user_id = ? ORDER BY "order" ASC, id ASC')
      .all(user.id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(links, null, 2),
        },
      ],
    };
  }
);

mcpServer.tool(
  'create_link',
  'Create a new link for a user',
  {
    type: 'object',
    properties: {
      user_email: { type: 'string', description: 'User email address' },
      name: { type: 'string', description: 'Link name/title (displayed text)' },
      url: { type: 'string', description: 'Link URL (must be a valid URL)' },
      type: { type: 'string', description: 'Link type (default: "link"). Common types: link, email, phone, etc.' },
      order: { type: 'number', description: 'Display order (lower numbers appear first, default: 0)' },
    },
    required: ['user_email', 'name', 'url'],
  },
  async (args) => {
    const { user_email, name, url, type = 'link', order = 0 } = args;
    const user = getUserByEmail(user_email);
    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: `User not found: ${user_email}`,
          },
        ],
      };
    }
    try {
      const result = db
        .prepare('INSERT INTO links (user_id, name, url, type, "order", created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))')
        .run(user.id, name, url, type, order);
      const newLink = getLinkById(result.lastInsertRowid);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(newLink, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating link: ${error.message}`,
          },
        ],
      };
    }
  }
);

mcpServer.tool(
  'update_link',
  'Update an existing link',
  {
    type: 'object',
    properties: {
      link_id: { type: 'number', description: 'Link ID (from list_links)' },
      name: { type: 'string', description: 'New link name/title' },
      url: { type: 'string', description: 'New link URL' },
      type: { type: 'string', description: 'New link type' },
      order: { type: 'number', description: 'New display order' },
    },
    required: ['link_id'],
  },
  async (args) => {
    const { link_id, name, url, type, order } = args;
    const link = getLinkById(link_id);
    if (!link) {
      return {
        content: [
          {
            type: 'text',
            text: `Link not found: ${link_id}`,
          },
        ],
      };
    }
    const updates = [];
    const values = [];
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (url !== undefined) {
      updates.push('url = ?');
      values.push(url);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
    }
    if (order !== undefined) {
      updates.push('"order" = ?');
      values.push(order);
    }
    if (updates.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(link, null, 2),
          },
        ],
      };
    }
    updates.push('updated_at = datetime("now")');
    values.push(link_id);
    try {
      db.prepare(`UPDATE links SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      const updatedLink = getLinkById(link_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(updatedLink, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating link: ${error.message}`,
          },
        ],
      };
    }
  }
);

mcpServer.tool(
  'delete_link',
  'Delete a link by ID',
  {
    type: 'object',
    properties: {
      link_id: {
        type: 'number',
        description: 'Link ID (from list_links)',
      },
    },
    required: ['link_id'],
  },
  async (args) => {
    const { link_id } = args;
    const link = getLinkById(link_id);
    if (!link) {
      return {
        content: [
          {
            type: 'text',
            text: `Link not found: ${link_id}`,
          },
        ],
      };
    }
    try {
      db.prepare('DELETE FROM links WHERE id = ?').run(link_id);
      return {
        content: [
          {
            type: 'text',
            text: `Link ${link_id} deleted successfully`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error deleting link: ${error.message}`,
          },
        ],
      };
    }
  }
);

mcpServer.tool(
  'list_users',
  'List all users in LinkStack (admin function)',
  {
    type: 'object',
    properties: {},
  },
  async () => {
    const users = db.prepare('SELECT id, email, name, created_at FROM users ORDER BY email ASC').all();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(users, null, 2),
        },
      ],
    };
  }
);

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// Authentication middleware
// Validates Bearer token against API key (set via environment variable at deployment)
// Clients fetch the API key from 1Password and pass it in Authorization header
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Bearer token required' });
  }
  const token = authHeader.substring(7);
  
  // Compare against API key (set via LINKSTACK_MCP_API_KEY env var)
  // Using constant-time comparison to prevent timing attacks
  if (token.length !== API_KEY.length || !constantTimeEqual(token, API_KEY)) {
    return res.status(403).json({ error: 'Forbidden: Invalid API key' });
  }
  next();
}

// Constant-time string comparison to prevent timing attacks
function constantTimeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'linkstack-mcp-server' });
});

// MCP HTTP endpoint (SSE-based for mcp-remote compatibility)
app.post('/mcp', authenticate, async (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Handle MCP protocol messages
  try {
    const message = req.body;
    
    // Process message through MCP server
    // Note: This is a simplified implementation
    // Full SSE streaming would require more complex handling
    const response = await mcpServer.handleRequest(message);
    
    res.write(`data: ${JSON.stringify(response)}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Start server
app.listen(PORT, () => {
  console.error(`[LinkStack MCP HTTP] Server running on port ${PORT}`);
  console.error(`[LinkStack MCP HTTP] Health check: http://localhost:${PORT}/health`);
  console.error(`[LinkStack MCP HTTP] MCP endpoint: http://localhost:${PORT}/mcp`);
  console.error(`[LinkStack MCP HTTP] API key configured (clients fetch from 1Password)`);
});
