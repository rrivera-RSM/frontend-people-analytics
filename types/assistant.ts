export type AssistantChatRole = "user" | "assistant";

export type AssistantChatMessage = {
  role: AssistantChatRole;
  content: string;
};

export type AssistantChatRequest = {
  employee_id: number;
  message: string;
  conversation: AssistantChatMessage[];
};

export type AssistantChatResponse = {
  answer: string;
  used_tools: string[];
  provider: string;
};
