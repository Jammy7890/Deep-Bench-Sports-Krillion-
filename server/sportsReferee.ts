const Type = { OBJECT: 'OBJECT', STRING: 'STRING', BOOLEAN: 'BOOLEAN', ARRAY: 'ARRAY' } as const;
const ThinkingLevel = { MINIMAL: 'minimal', LOW: 'low' } as const;
type ThinkingLevel = (typeof ThinkingLevel)[keyof typeof ThinkingLevel];

interface CerebrasClient {
  models: {
    generateContent: (args: {
      model: string;
      contents: string;
      config?: { thinkingConfig?: { thinkingLevel?: ThinkingLevel }; responseMimeType?: string; responseSchema?: Record<string, unknown> };
    }) => Promise<{ text?: string }>;
  };
}
import {
  RARITY_CONFIG,
  type EvaluationResult,
  type MatchType,
  type QuestionPrompt,
  type RarityTier,
  type SportCategory,
  type TierExample,
} from '../src/types.ts';

export interface ApiRequest {
  method?: string;
  body?: unknown;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  end?: (body?: string) => void;
}

const PRIMARY_MODEL = 'qwen-3.8-27b';

function parseBody(rawBody: unknown): Record<string, unknown> {
  if (!rawBody) return {};
  if (typeof rawBody === 'string') {
    try {
      const parsed = JSON.parse(rawBody);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof rawBody === 'object') {
    return rawBody as Record<string, unknown>;
  }
  return {};
}

function toCerebrasSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = { ...schema };
  const rawType = output.type;
  if (typeof rawType === 'string') output.type = rawType.toLowerCase();
  if (output.nullable === true && typeof output.type === 'string') {
    output.type = [output.type, 'null'];
    delete output.nullable;
  }
  if (output.properties && typeof output.properties === 'object') {
    const properties = output.properties as Record<string, Record<string, unknown>>;
    output.properties = Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [key, toCerebrasSchema(value)])
    );
    output.additionalProperties = false;
  }
  if (output.items && typeof output.items === 'object') {
    output.items = toCerebrasSchema(output.items as Record<string, unknown>);
  }
  return output;
}

function getAiClient(): CerebrasClient {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_CEREBRAS_API_KEY') {
    throw new Error(
      'CEREBRAS_API_KEY is not configured. Add it in Vercel Project Settings > Environment Variables.'
    );
  }

  return {
    models: {
      async generateContent({ model, contents, config }) {
        const responseSchema = config?.responseSchema
          ? toCerebrasSchema(config.responseSchema)
          : undefined;
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: contents }],
            max_completion_tokens: 1800,
            reasoning_effort: config?.thinkingConfig?.thinkingLevel === 'low' ? 'low' : 'none',
            ...(responseSchema
              ? {
                  response_format: {
                    type: 'json_schema',
                    json_schema: {
                      name: 'deep_bench_response',
                      strict: false,
                      schema: responseSchema,
                    },
                  },
                }
              : {}),
          }),
          signal: AbortSignal.timeout(25000),
        });

        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string | null } }>;
          error?: { message?: string };
        };
        if (!response.ok) {
          const error = new Error(payload.error?.message || `Cerebras API request failed (${response.status}).`) as Error & { status?: number };
          error.status = response.status;
          throw error;
        }
        return { text: payload.choices?.[0]?.message?.content ?? '' };
      },
    },
  };
}

function getCategoryFocusInstruction(category: SportCategory): string {
  switch (category) {
    case 'Basketball':
      return 'Focus strictly on Basketball (NBA, WNBA, NCAA, FIBA, positions, plays, awards, rules, iconic arenas, shot types).';
    case 'American Football':
      return 'Focus strictly on American Football (NFL, NCAA, positions, coverages, penalties, routes, formations, trophies, stats).';
    case 'Baseball':
      return 'Focus strictly on Baseball (MLB, pitches, fielding plays, rules, stats, positions, ballparks, awards).';
    case 'Soccer':
      return 'Focus strictly on Association Football / Soccer (Premier League, World Cup, Champions League, tactics, positions, fouls, set pieces, clubs).';
    case 'Volleyball & Court':
      return 'Focus on Volleyball, Tennis, Badminton, Pickleball, and Squash (techniques like set/volley/dig/spike, court zones, scoring terms, tournaments, equipment).';
    case 'Hockey':
      return 'Focus strictly on Ice Hockey (NHL, penalties, positions, shots/dekes, trophies, rules, equipment, Stanley Cup winners).';
    case 'Combat & Olympic':
      return 'Focus on Boxing, MMA/UFC, Wrestling, Track & Field, Swimming, Gymnastics, and Olympic events (techniques, weight classes, events, fouls, scoring).';
    case 'All Sports':
    default:
      return 'Mix widely across Basketball, American Football, Baseball, Soccer, Volleyball, Tennis, Ice Hockey, Golf, Combat Sports, and Olympic Track & Field.';
  }
}

function normalizeRarity(value: string | undefined | null): RarityTier {
  const cleaned = String(value ?? '').trim().toLowerCase();
  if (cleaned === 'mythic' || cleaned === 'legendary' || cleaned === 'one in a krillion') {
    return 'Mythic';
  }
  if (cleaned === 'deep cut' || cleaned === 'epic') {
    return 'Deep Cut';
  }
  if (cleaned === 'all-star' || cleaned === 'all star' || cleaned === 'rare') {
    return 'All-Star';
  }
  if (cleaned === 'starter' || cleaned === 'uncommon') {
    return 'Starter';
  }
  return 'Rookie';
}

function normalizeMatchType(value: string | undefined | null, isValid: boolean): MatchType {
  if (!isValid) return 'INVALID';
  const cleaned = String(value ?? '').trim().toUpperCase();
  if (cleaned === 'ALIAS_SWITCH') return 'ALIAS_SWITCH';
  if (cleaned === 'TYPO_CORRECTED') return 'TYPO_CORRECTED';
  return 'EXACT';
}

function isTransientError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (
    status === 404 ||
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /404|408|429|500|502|503|504|NOT_FOUND|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|timed out|fetch failed|ECONNRESET|ETIMEDOUT/i.test(
    msg
  );
}

function safeParseJsonText<T>(rawText: string | undefined | null): T | null {
  if (!rawText || typeof rawText !== 'string') return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function formatApiError(err: unknown): { status: number; message: string } {
  const rawStatus = (err as { status?: number })?.status;
  const rawMessage = err instanceof Error ? err.message : 'Unexpected server error.';

  let parsedMessage = rawMessage;
  let parsedCode = rawStatus;
  try {
    if (rawMessage.trim().startsWith('{')) {
      const json = JSON.parse(rawMessage) as {
        error?: { code?: number; message?: string; status?: string };
      };
      if (json?.error?.message) parsedMessage = json.error.message;
      if (json?.error?.code) parsedCode = json.error.code;
    }
  } catch {
    // Keep rawMessage
  }

  if (
    parsedCode === 403 ||
    parsedCode === 400 ||
    /API_KEY_INVALID|PERMISSION_DENIED/i.test(rawMessage)
  ) {
    return {
      status: parsedCode ?? 400,
      message: 'Cerebras authentication error. Please check your CEREBRAS_API_KEY configuration.',
    };
  }
  if (parsedCode === 503 || /503|UNAVAILABLE|high demand/i.test(rawMessage)) {
    return {
      status: 503,
      message: 'AI servers are temporarily busy. Please try again in a moment.',
    };
  }
  if (parsedCode === 429 || /429|RESOURCE_EXHAUSTED/i.test(rawMessage)) {
    return {
      status: 429,
      message: 'Rate limit reached right now. Please wait a few seconds and retry.',
    };
  }
  return {
    status: parsedCode && parsedCode >= 400 ? parsedCode : 500,
    message: parsedMessage,
  };
}

async function generateWithFallback<T = unknown>(
  ai: CerebrasClient,
  contents: string,
  responseSchema: Record<string, unknown>,
  primaryThinking: ThinkingLevel = ThinkingLevel.MINIMAL
): Promise<{ text: string; parsed: T }> {
  const attempts: Array<{ model: string; thinkingLevel: ThinkingLevel; delayMs: number }> = [
    { model: PRIMARY_MODEL, thinkingLevel: primaryThinking, delayMs: 100 },
    { model: PRIMARY_MODEL, thinkingLevel: primaryThinking, delayMs: 0 },
  ];

  let lastError: unknown;
  for (const step of attempts) {
    try {
      const response = await ai.models.generateContent({
        model: step.model,
        contents,
        config: {
          thinkingConfig: { thinkingLevel: step.thinkingLevel },
          responseMimeType: 'application/json',
          responseSchema,
        },
      });
      const text = (response.text ?? '').trim();
      const parsed = safeParseJsonText<T>(text);
      if (parsed === null) throw new Error(`Model ${step.model} returned non-JSON response.`);
      return { text, parsed };
    } catch (err) {
      lastError = err;
      const malformed = err instanceof Error && err.message.includes('returned non-JSON response');
      if (!isTransientError(err) && !malformed) throw err;
      if (step.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, step.delayMs));
    }
  }
  throw lastError;
}

interface WikiPageExtract {
  pageid: number;
  title: string;
  extract: string;
}

async function fetchWikipediaExtracts(query: string): Promise<WikiPageExtract[]> {
  if (!query.trim()) return [];
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query.trim()
  )}&gsrlimit=2&prop=extracts&exintro=1&explaintext=1&exsentences=8&format=json`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DeepBenchSportsTrivia/1.0 (https://deepbench.app)' },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { pageid?: number; title?: string; extract?: string; index?: number }
        >;
      };
    };
    const pages = Object.values(data.query?.pages ?? {});
    pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
    return pages
      .filter((p) => p.pageid && p.title && p.extract)
      .map((p) => ({
        pageid: p.pageid!,
        title: p.title!,
        extract: p.extract!.trim(),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyWithWikipedia(
  ai: CerebrasClient,
  prompt: string,
  sport: string,
  subCategory: string,
  rawInput: string,
  resolvedEntity: string | null,
  todayStr: string
): Promise<{
  parsed: {
    isValid?: boolean;
    matchType?: string;
    canonicalAnswer?: string | null;
    rarity?: string | null;
    pickRate?: string | null;
    refereeNote?: string;
  } | null;
  verifiedSource: { title: string; url: string } | null;
}> {
  const cleanSport = sport.split('&')[0].trim();
  const queries: string[] = [];
  if (resolvedEntity && resolvedEntity.toLowerCase() !== rawInput.toLowerCase()) {
    queries.push(resolvedEntity);
  }
  queries.push(`${rawInput} ${cleanSport}`);

  const results = await Promise.all(queries.map((q) => fetchWikipediaExtracts(q)));
  const seen = new Set<number>();
  const pages: WikiPageExtract[] = [];
  for (const list of results) {
    for (const p of list) {
      if (!seen.has(p.pageid)) {
        seen.add(p.pageid);
        pages.push(p);
      }
    }
  }

  if (pages.length === 0) {
    return { parsed: null, verifiedSource: null };
  }

  const topPage = pages[0];
  const verifiedSource = {
    title: `${topPage.title} — Wikipedia`,
    url: `https://en.wikipedia.org/?curid=${topPage.pageid}`,
  };

  const contextBlock = pages
    .slice(0, 3)
    .map((p) => `[${p.title}]\n${p.extract}`)
    .join('\n\n');

  try {
    const formatRes = await generateWithFallback<{
      isValid?: boolean;
      matchType?: string;
      canonicalAnswer?: string | null;
      rarity?: string | null;
      pickRate?: string | null;
      refereeNote?: string;
    }>(
      ai,
      `You are the Deep Bench Sports Referee. Today is ${todayStr}.
Use the LIVE Wikipedia extracts below (which include up-to-date 2025/2026 facts) to adjudicate the submission.

Prompt: "${prompt}" (${sport} · ${subCategory})
Submitted: "${rawInput}"
${resolvedEntity ? `Resolved Entity Hint: "${resolvedEntity}"` : ''}

LIVE WIKIPEDIA EXTRACTS (trust these over outdated memory!):
${contextBlock}

Rules:
- If the live extracts confirm "${rawInput}" (including via nickname/initials like "PCA" -> "Pete Crow-Armstrong", alias, or minor typo) validly satisfies "${prompt}", set isValid = true, set canonicalAnswer to the official full name/term, and set matchType = "ALIAS_SWITCH" for nicknames/initials/aliases, "TYPO_CORRECTED" for typos, or "EXACT".
- Assign rarity (Rookie ~22–45%, Starter ~8–19%, All-Star ~3–7%, Deep Cut ~0.8–2.9%, Mythic <0.8%) based on how common vs. obscure this answer is for the prompt, and format pickRate as an estimated percentage string (e.g. "~4.2%").
- Write 1 crisp sentence in refereeNote citing the verified fact.`,
      {
        type: Type.OBJECT,
        properties: {
          isValid: { type: Type.BOOLEAN },
          matchType: { type: Type.STRING },
          canonicalAnswer: { type: Type.STRING, nullable: true },
          rarity: { type: Type.STRING, nullable: true },
          pickRate: { type: Type.STRING, nullable: true },
          refereeNote: { type: Type.STRING },
        },
        required: ['isValid', 'matchType', 'refereeNote'],
      },
      ThinkingLevel.MINIMAL
    );

    return { parsed: formatRes.parsed, verifiedSource };
  } catch (err) {
    console.error('[verifyWithWikipedia:format]', err);
    return { parsed: null, verifiedSource: null };
  }
}

function shouldVerifyWithWeb(
  prompt: string,
  subCategory: string,
  rawInput: string,
  stage1NeedsWeb: boolean,
  stage1Valid: boolean
): boolean {
  if (stage1NeedsWeb) return true;
  if (stage1Valid) return false;
  const cleaned = rawInput.trim();
  if (cleaned.length < 2 || cleaned.length > 50) return false;
  if (
    /^(ball|throw|hit|run|kick|pass|score|point|goal|player|team|yes|no|idk|asdf+)$/i.test(
      cleaned
    )
  ) {
    return false;
  }
  const timeSensitivePrompt =
    /mvp|award|winner|won|champion|title|trophy|cy young|heisman|ballon|rookie of the year|dpoy|all-star|hall of fame|player|athlete|team|club|coach|manager|record|medal|olympic|202\d|recent|current|active/i.test(
      `${prompt} ${subCategory}`
    );
  return timeSensitivePrompt;
}

function ensurePostMethod(req: ApiRequest, res: ApiResponse): boolean {
  const method = (req.method ?? 'POST').toUpperCase();
  if (method === 'OPTIONS') {
    res.setHeader?.('Allow', 'POST, OPTIONS');
    res.status(204);
    if (res.end) res.end();
    else res.json({});
    return false;
  }
  if (method !== 'POST') {
    res.setHeader?.('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    return false;
  }
  return true;
}

export async function handleQuestionsBatch(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!ensurePostMethod(req, res)) return;

  try {
    const body = parseBody(req.body);
    const category = (body.category ?? 'All Sports') as SportCategory;
    const rawCount = Number(body.count ?? 4);
    const count = Math.min(Math.max(Number.isFinite(rawCount) ? rawCount : 4, 1), 6);
    const previousPrompts: string[] = Array.isArray(body.previousPrompts)
      ? body.previousPrompts.filter((p: unknown) => typeof p === 'string').slice(-35)
      : [];

    const ai = getAiClient();
    const avoidBlock =
      previousPrompts.length > 0
        ? `\nDo NOT repeat or closely paraphrase any of these already-used prompts:\n- ${previousPrompts.join('\n- ')}`
        : '';

    const response = await generateWithFallback<{
      questions?: Array<{
        sport: string;
        subCategory: string;
        prompt: string;
        tierExamples?: Array<{ tier: string; answer: string; pickRate: string }>;
      }>;
    }>(
      ai,
      `Generate ${count} open-ended sports trivia prompts for a Krillion-style rarity game.
${getCategoryFocusInstruction(category)}

Rules:
- Each prompt must start with "Name a..." or "Name an..." and have 10+ valid answers from obvious (Rookie) to obscure (Mythic). Never single-answer trivia.
- 6–14 words, crisp and unambiguous. Vary athletes, plays/techniques, penalties, rules, venues, equipment.
- For each prompt, include 5 concise, distinct valid tierExamples (one per tier: Rookie, Starter, All-Star, Deep Cut, Mythic — never repeat the same entity or former name of the same stadium/team).${avoidBlock}`,
      {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sport: { type: Type.STRING },
                subCategory: { type: Type.STRING },
                prompt: { type: Type.STRING },
                tierExamples: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      tier: { type: Type.STRING },
                      answer: { type: Type.STRING },
                      pickRate: { type: Type.STRING },
                    },
                    required: ['tier', 'answer', 'pickRate'],
                  },
                },
              },
              required: ['sport', 'subCategory', 'prompt', 'tierExamples'],
            },
          },
        },
        required: ['questions'],
      },
      ThinkingLevel.LOW
    );

    const parsed = response.parsed;

    const list: QuestionPrompt[] = (parsed.questions ?? [])
      .filter((q) => q?.prompt && q?.sport)
      .map((q, idx) => ({
        id: `q-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        sport: String(q.sport).trim(),
        subCategory: String(q.subCategory || 'General').trim(),
        prompt: String(q.prompt).trim(),
        tierExamples: (q.tierExamples ?? [])
          .slice(0, 5)
          .map((ex) => ({
            tier: normalizeRarity(ex.tier),
            answer: String(ex.answer ?? '').trim(),
            pickRate: String(ex.pickRate ?? '').trim(),
          }))
          .filter((ex) => ex.answer.length > 0),
      }));

    if (list.length === 0) {
      res.status(502).json({ error: 'The question generator returned no prompts. Please retry.' });
      return;
    }

    res.status(200).json({ questions: list });
  } catch (err) {
    const formatted = formatApiError(err);
    console.error('[questions/batch]', err);
    res.status(formatted.status).json({ error: formatted.message });
  }
}

export async function handleEvaluate(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!ensurePostMethod(req, res)) return;

  try {
    const body = parseBody(req.body);
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const sport = typeof body.sport === 'string' ? body.sport.trim() : 'Sports';
    const subCategory =
      typeof body.subCategory === 'string' ? body.subCategory.trim() : 'General';
    const rawInput =
      typeof body.userAnswer === 'string' ? body.userAnswer.trim().slice(0, 100) : '';
    const currentStreak = Math.max(0, Math.floor(Number(body.currentStreak ?? 0)));
    const timedOut = Boolean(body.timedOut);
    const minRarity: RarityTier =
      typeof body.minRarity === 'string' ? normalizeRarity(body.minRarity) : 'Rookie';

    const providedExamples: TierExample[] = Array.isArray(body.tierExamples)
      ? (body.tierExamples as TierExample[]).filter((e) => e && e.answer)
      : [];

    if (!prompt) {
      res.status(400).json({ error: 'Missing prompt for evaluation.' });
      return;
    }

    if (timedOut || !rawInput) {
      let examples = providedExamples;
      if (examples.length === 0) {
        const ai = getAiClient();
        const exRes = await generateWithFallback<{
          tierExamples?: Array<{ tier: string; answer: string; pickRate: string }>;
        }>(
          ai,
          `For "${prompt}" (${sport}), list 5 valid answers (Rookie, Starter, All-Star, Deep Cut, Mythic).`,
          {
            type: Type.OBJECT,
            properties: {
              tierExamples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tier: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    pickRate: { type: Type.STRING },
                  },
                  required: ['tier', 'answer', 'pickRate'],
                },
              },
            },
            required: ['tierExamples'],
          }
        );
        examples = (exRes.parsed.tierExamples ?? []).map((e) => ({
          tier: normalizeRarity(e.tier),
          answer: String(e.answer ?? '').trim(),
          pickRate: String(e.pickRate ?? '').trim(),
        }));
      }

      const timeoutResult: EvaluationResult = {
        isValid: false,
        belowMinRarity: false,
        detectedRarity: null,
        matchType: timedOut ? 'TIMEOUT' : 'INVALID',
        rawInput: rawInput || '—',
        canonicalAnswer: null,
        rarity: null,
        pickRate: null,
        basePoints: 0,
        streakBonus: 0,
        totalPoints: 0,
        refereeNote: timedOut
          ? 'Shot clock expired before an answer was locked in.'
          : 'No answer submitted.',
        tierExamples: examples,
      };
      res.status(200).json(timeoutResult);
      return;
    }

    const ai = getAiClient();
    const needsExamples = providedExamples.length === 0;
    const todayStr = new Date().toISOString().slice(0, 10);

    const refereePrompt = `Sports Referee & Rarity Judge. Today's date is ${todayStr}.
Prompt: "${prompt}" (${sport} · ${subCategory})
Submitted: "${rawInput}"

Rules:
- resolvedEntity: If "${rawInput}" refers to a real athlete, team, or sports term (even via nickname, initials like "PCA"->"Pete Crow-Armstrong" or "SGA"->"Shai Gilgeous-Alexander", last name, or typo), put the full official name in resolvedEntity (even if you think they didn't win or qualify!). Null only if it's pure nonsense.
- EXACT: Matches a valid answer cleanly.
- TYPO_CORRECTED: Realistic spelling/phonetic typo or missing accent (e.g. "knucleball"->"Knuckleball", "jokic"->"Nikola Jokić") clearly matching one valid answer. Reject gibberish or words spelling a different sports entity.
- ALIAS_SWITCH: Valid colloquial/regional/slang sports term, OR a real athlete nickname / initials / unambiguous last name (e.g. "PCA"->"Pete Crow-Armstrong", "SGA"->"Shai Gilgeous-Alexander", "CMC"->"Christian McCaffrey", "CR7"->"Cristiano Ronaldo", "LBJ"->"LeBron James", "AD"->"Anthony Davis", volleyball "volley"->"Set", "bump"->"Forearm Pass", soccer "keeper"->"Goalkeeper", "pk"->"Penalty Kick", basketball "trey"->"Three-Pointer", "dime"->"Assist", baseball "ribby"->"RBI", "dinger"->"Home Run", football "pick"->"Interception"). Accept and switch canonicalAnswer to the official full name/term.
- INVALID: Wrong sport/constraint, factually wrong, or too generic ("ball", "throw", "hit").
- needsWebVerification: Set TRUE if the prompt involves awards, champions, records, rosters, or a player/nickname/initials (especially 2025/2026 winners or abbreviations like "pca") where you are NOT 100% certain of current facts as of ${todayStr}.
- Rarity (if valid): Rookie (~22–45%), Starter (~8–19%), All-Star (~3–7%), Deep Cut (~0.8–2.9%), Mythic (<0.8%).
- refereeNote: 1 crisp sentence.`;

    const baseProps: Record<string, unknown> = {
      isValid: { type: Type.BOOLEAN },
      needsWebVerification: { type: Type.BOOLEAN },
      resolvedEntity: { type: Type.STRING, nullable: true },
      matchType: { type: Type.STRING },
      canonicalAnswer: { type: Type.STRING, nullable: true },
      rarity: { type: Type.STRING, nullable: true },
      pickRate: { type: Type.STRING, nullable: true },
      refereeNote: { type: Type.STRING },
    };
    const requiredFields = [
      'isValid',
      'needsWebVerification',
      'matchType',
      'refereeNote',
    ];

    if (needsExamples) {
      baseProps.tierExamples = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            tier: { type: Type.STRING },
            answer: { type: Type.STRING },
            pickRate: { type: Type.STRING },
          },
          required: ['tier', 'answer', 'pickRate'],
        },
      };
      requiredFields.push('tierExamples');
    }

    const response = await generateWithFallback<{
      isValid?: boolean;
      needsWebVerification?: boolean;
      resolvedEntity?: string | null;
      matchType?: string;
      canonicalAnswer?: string | null;
      rarity?: string | null;
      pickRate?: string | null;
      refereeNote?: string;
      tierExamples?: Array<{ tier: string; answer: string; pickRate: string }>;
    }>(
      ai,
      needsExamples
        ? `${refereePrompt}\nAlso include 5 tierExamples (Rookie to Mythic).`
        : refereePrompt,
      {
        type: Type.OBJECT,
        properties: baseProps,
        required: requiredFields,
      },
      ThinkingLevel.LOW
    );

    let parsed = response.parsed;

    let verifiedSource: { title: string; url: string } | null = null;
    const stage1Valid = Boolean(parsed.isValid && parsed.canonicalAnswer);

    if (
      shouldVerifyWithWeb(
        prompt,
        subCategory,
        rawInput,
        Boolean(parsed.needsWebVerification),
        stage1Valid
      )
    ) {
      const grounded = await verifyWithWikipedia(
        ai,
        prompt,
        sport,
        subCategory,
        rawInput,
        parsed.resolvedEntity ?? null,
        todayStr
      );
      if (grounded.parsed) {
        parsed = {
          ...parsed,
          ...grounded.parsed,
        };
        verifiedSource = grounded.verifiedSource;
      }
    }

    const rawCorrect = Boolean(parsed.isValid && parsed.canonicalAnswer);
    const detectedRarity: RarityTier | null = rawCorrect
      ? normalizeRarity(parsed.rarity)
      : null;
    const meetsMinRarity =
      rawCorrect &&
      detectedRarity !== null &&
      RARITY_CONFIG[detectedRarity].rank >= RARITY_CONFIG[minRarity].rank;

    const isValid = rawCorrect && meetsMinRarity;
    const belowMinRarity = rawCorrect && !meetsMinRarity;
    const matchType = normalizeMatchType(parsed.matchType, rawCorrect);
    const rarity: RarityTier | null = isValid ? detectedRarity : null;
    const canonical = rawCorrect ? String(parsed.canonicalAnswer ?? rawInput).trim() : null;

    const basePoints = rarity ? RARITY_CONFIG[rarity].points : 0;
    const streakBonus = isValid ? Math.min(currentStreak, 10) * 50 : 0;
    const totalPoints = basePoints + streakBonus;

    const tierExamples: TierExample[] = needsExamples
      ? (parsed.tierExamples ?? [])
          .slice(0, 5)
          .map((ex) => ({
            tier: normalizeRarity(ex.tier),
            answer: String(ex.answer ?? '').trim(),
            pickRate: String(ex.pickRate ?? '').trim(),
          }))
          .filter((ex) => ex.answer.length > 0)
      : providedExamples;

    const refereeNote = belowMinRarity
      ? `"${canonical}" is valid (${detectedRarity}), but this round ${minRarity === 'Mythic' ? 'requires Mythic only' : `requires ${minRarity} or rarer`}.`
      : String(parsed.refereeNote ?? '').trim() ||
        (isValid ? 'Verified valid sports answer.' : 'Answer did not match the prompt rules.');

    const rawPickRate = String(parsed.pickRate ?? '').trim();
    const validPickRate = /\d/.test(rawPickRate)
      ? rawPickRate
      : rarity
        ? RARITY_CONFIG[rarity].pickBand
        : null;

    const result: EvaluationResult = {
      isValid,
      belowMinRarity,
      detectedRarity,
      matchType: isValid ? matchType : 'INVALID',
      rawInput,
      canonicalAnswer: isValid ? canonical : null,
      rarity,
      pickRate: isValid ? validPickRate : null,
      basePoints,
      streakBonus,
      totalPoints,
      refereeNote,
      tierExamples,
      verifiedSource,
    };

    res.status(200).json(result);
  } catch (err) {
    const formatted = formatApiError(err);
    console.error('[evaluate]', err);
    res.status(formatted.status).json({ error: formatted.message });
  }
}
