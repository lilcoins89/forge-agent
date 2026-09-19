export const FILE_TOOLS = [
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create or overwrite a text file in the workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read a file from the workspace.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List every file path currently in the workspace.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Delete a file from the workspace.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_replace",
      description: "Replace an exact string in a file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          old_string: { type: "string" },
          new_string: { type: "string" },
          replace_all: { type: "boolean" },
        },
        required: ["path", "old_string", "new_string"],
      },
    },
  },
] as const;

export const GITHUB_TOOLS = [
  {
    type: "function",
    function: {
      name: "github_create_repo",
      description: "Create a GitHub repository on the authenticated account.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          private: { type: "boolean" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_push",
      description: "Commit and push every current workspace file to a GitHub repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          message: { type: "string" },
          branch: { type: "string" },
          private: { type: "boolean" },
        },
        required: ["repo"],
      },
    },
  },
] as const;
