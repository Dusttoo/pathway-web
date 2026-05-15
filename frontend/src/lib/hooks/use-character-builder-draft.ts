import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CharacterBuilderDraft<TState = unknown> = {
  id: string;
  user_id: string;
  name: string;
  builder_state: TState;
  current_step: number;
  created_at: string;
  updated_at: string;
};

export const characterBuilderDraftKeys = {
  all: ["character-builder-draft"] as const,
};

async function parseError(res: Response): Promise<Error> {
  const body = await res.text();
  try {
    const parsed = JSON.parse(body) as { error?: string };
    return new Error(parsed.error ?? body);
  } catch {
    return new Error(body || res.statusText);
  }
}

export function useCharacterBuilderDraft<TState = unknown>(options?: { enabled?: boolean }) {
  return useQuery<CharacterBuilderDraft<TState> | null, Error>({
    queryKey: characterBuilderDraftKeys.all,
    queryFn: async () => {
      const res = await fetch("/api/characters/draft");
      if (!res.ok) throw await parseError(res);
      const body = (await res.json()) as { draft: CharacterBuilderDraft<TState> | null };
      return body.draft;
    },
    enabled: options?.enabled !== false,
  });
}

export function useSaveCharacterBuilderDraft<TState = unknown>() {
  const queryClient = useQueryClient();

  return useMutation<
    CharacterBuilderDraft<TState>,
    Error,
    { builder_state: TState; current_step: number; name?: string }
  >({
    mutationFn: async (payload) => {
      const res = await fetch("/api/characters/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await parseError(res);
      const body = (await res.json()) as { draft: CharacterBuilderDraft<TState> };
      return body.draft;
    },
    onSuccess: (draft) => {
      queryClient.setQueryData(characterBuilderDraftKeys.all, draft);
    },
  });
}

export function useDeleteCharacterBuilderDraft() {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/characters/draft", { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw await parseError(res);
    },
    onSuccess: () => {
      queryClient.setQueryData(characterBuilderDraftKeys.all, null);
    },
  });
}
