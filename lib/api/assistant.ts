import { postJson } from "@/lib/api/http";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
} from "@/types/assistant";

export function sendAssistantChatMessage(
  payload: AssistantChatRequest,
): Promise<AssistantChatResponse> {
  return postJson<AssistantChatRequest, AssistantChatResponse>(
    "/api/assistant/chat",
    payload,
  );
}
