export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  apiModel: string;
  supportsThinking: boolean;
  inputPricePer1M: number;
  outputPricePer1M: number;
}

/** Haiku first (lowest cost), then Sonnet, then Opus. */
export const MODELS: ModelDefinition[] = [
  {
    id: "haiku-4-5",
    name: "Klawd ku 4.5",
    description: "fastist n cheepest",
    apiModel: "claude-haiku-4-5-20251001",
    supportsThinking: true,
    inputPricePer1M: 1,
    outputPricePer1M: 5,
  },
  {
    id: "sonnet-4-5",
    name: "Klawd son 4.6",
    description: "fasst n smort",
    apiModel: "claude-sonnet-4-5-20250929",
    supportsThinking: true,
    inputPricePer1M: 3,
    outputPricePer1M: 15,
  },
  {
    id: "opus-4-5",
    name: "Klawd 4.6",
    description: "moast caypabl",
    apiModel: "claude-opus-4-5-20251101",
    supportsThinking: true,
    inputPricePer1M: 5,
    outputPricePer1M: 25,
  },
];

export const DEFAULT_MODEL = MODELS[0];

export function getModelById(id: string): ModelDefinition {
  return MODELS.find((m) => m.id === id) ?? DEFAULT_MODEL;
}

export function calculateCost(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number
): number {
  return (
    (inputTokens / 1_000_000) * model.inputPricePer1M +
    (outputTokens / 1_000_000) * model.outputPricePer1M
  );
}
