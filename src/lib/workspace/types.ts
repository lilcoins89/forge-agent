export type FileMap = Record<string, string>;

export type ChatRole = "user" | "assistant" | "system";

export type ToolTrace = {
  id: string;
  name: string;
  result: string;
  ok: boolean;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  traces?: ToolTrace[];
  createdAt: number;
};

export type GithubSettings = {
  token: string;
  login: string;
  defaultRepo: string;
  defaultBranch: string;
};

export type WorkspaceSnapshot = {
  projectName: string;
  files: FileMap;
  activePath: string;
  messages: ChatMessage[];
  previewEntry: string;
};
