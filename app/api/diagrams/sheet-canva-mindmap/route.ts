import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';
import { readFileSync } from 'fs';
import { join } from 'path';

function getMistralClient(): Mistral | null {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return null;
  return new Mistral({ apiKey });
}

function loadMindmapInstructions(): string {
  try {
    const p = join(process.cwd(), 'prompts', 'mindmap-canva-instructions.md');
    return readFileSync(p, 'utf-8');
  } catch (error) {
    console.error('sheet-canva-mindmap: failed to load instructions file', error);
    return '';
  }
}

function getContextFromDocuments(documents: unknown): string {
  if (!Array.isArray(documents) || documents.length === 0) return '';
  const allChunks: string[] = [];
  for (const doc of documents) {
    if (!doc || typeof doc !== 'object') continue;
    const d = doc as Record<string, unknown>;
    if (Array.isArray(d.chunks)) {
      for (const c of d.chunks) {
        if (typeof c === 'string' && c.trim()) allChunks.push(c);
      }
    } else if (typeof d.text === 'string' && d.text.trim()) {
      const text = d.text as string;
      const size = 1000;
      for (let i = 0; i < text.length; i += size) {
        allChunks.push(text.slice(i, i + size));
      }
    }
  }
  return allChunks.join('\n\n---\n\n');
}

function extractJsonObject(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Ответ модели не содержит JSON-объекта');
  }
  return JSON.parse(body.slice(start, end + 1)) as Record<string, unknown>;
}

type SheetFontId = 'sans' | 'serif' | 'mono';

type SheetItemOut = {
  id: string;
  kind: 'element' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontId: SheetFontId;
  color: string;
  backgroundColor: string;
  fontSize: number;
};

type SheetConnectionOut = {
  id: string;
  fromId: string;
  fromHandle: 0 | 1 | 2 | 3;
  toId: string;
  toHandle: 0 | 1 | 2 | 3;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function normalizeFontId(v: unknown): SheetFontId {
  if (v === 'serif' || v === 'mono') return v;
  return 'sans';
}

function normalizeItem(raw: unknown, id: string): SheetItemOut | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const kind = o.kind === 'text' ? 'text' : 'element';
  const x = clamp(Number(o.x) || 0, 0, 2000);
  const y = clamp(Number(o.y) || 0, 0, 2000);
  const width = clamp(Number(o.width) || (kind === 'element' ? 200 : 180), 40, 900);
  const height = clamp(Number(o.height) || (kind === 'element' ? 80 : 40), 24, 600);
  const text = typeof o.text === 'string' ? o.text.slice(0, 2000) : '';
  const fontId = normalizeFontId(o.fontId);
  // Принудительно используем единую палитру MindMap (фон #e2e8f0, текст #0f2429) для всех элементов.
  const color = kind === 'element'
    ? '#0f2429'
    : (typeof o.color === 'string' && o.color.length > 0 ? String(o.color).slice(0, 32) : '#0f2429');
  const backgroundColor = kind === 'element' ? '#e2e8f0' : 'transparent';
  const fontSize = clamp(Math.round(Number(o.fontSize) || (kind === 'element' ? 14 : 12)), 8, 48);
  return {
    id,
    kind,
    x,
    y,
    width,
    height,
    text,
    fontId,
    color,
    backgroundColor,
    fontSize,
  };
}

function normalizeHandle(v: unknown): 0 | 1 | 2 | 3 {
  const n = Math.round(Number(v));
  if (n === 0 || n === 1 || n === 2 || n === 3) return n;
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const objectDescription = typeof body.objectDescription === 'string' ? body.objectDescription.trim() : '';
    const language = body.language === 'en' ? 'en' : 'ru';
    const isFromProject = Boolean(body.isFromProject);
    const documents = body.documents;

    if (!objectDescription) {
      return NextResponse.json({ error: 'Описание не предоставлено' }, { status: 400 });
    }

    const client = getMistralClient();
    if (!client) {
      return NextResponse.json(
        { error: 'MISTRAL_API_KEY не настроен. Установите ключ в переменных окружения.' },
        { status: 500 }
      );
    }

    const mindmapInstructions = loadMindmapInstructions();

    const projectContext =
      isFromProject && documents ? getContextFromDocuments(documents) : '';
    const trimmedContext = projectContext.slice(0, 18000);

    const systemHeader =
      language === 'en'
        ? `You output ONLY valid JSON (no markdown, no commentary) for a canvas mind map editor.\nFollow the rules below EXACTLY. All node backgroundColor MUST be #e2e8f0 and text color MUST be #0f2429. There must be exactly one root element at the top, all other nodes go strictly below it, every connection goes from a node's bottom (fromHandle=2) to a child's top (toHandle=0). Avoid crossing connections by laying out subtrees in non-overlapping horizontal bands. Widen boxes so text fits on a single line.`
        : `Ты возвращаешь ТОЛЬКО валидный JSON (без markdown, без пояснений) для редактора интеллект-карты на холсте.\nСтрого соблюдай правила ниже. У всех узлов backgroundColor ОБЯЗАТЕЛЬНО #e2e8f0, цвет текста — #0f2429. На диаграмме РОВНО ОДИН корневой элемент сверху, все остальные — ниже него, все связи идут от низа родителя (fromHandle=2) к верху потомка (toHandle=0). Раскладывай поддеревья так, чтобы связи не пересекались. Если текст длинный — увеличивай ширину блока так, чтобы текст помещался в одну строку. Все подписи на русском.`;

    const systemPrompt = mindmapInstructions
      ? `${systemHeader}\n\n=== ПОЛНЫЕ ПРАВИЛА ГЕНЕРАЦИИ MINDMAP ===\n${mindmapInstructions}`
      : systemHeader;

    const contextBlock = trimmedContext
      ? language === 'en'
        ? `\n\n=== PROJECT DOCUMENTS (use ONLY this information, do not invent anything outside it) ===\n${trimmedContext}\n=== END OF PROJECT DOCUMENTS ===`
        : `\n\n=== ДОКУМЕНТЫ ПРОЕКТА (используй ТОЛЬКО эту информацию, ничего не выдумывай вне неё) ===\n${trimmedContext}\n=== КОНЕЦ ДОКУМЕНТОВ ПРОЕКТА ===`
      : '';

    const userPrompt =
      language === 'en'
        ? `Build a mind map for the following subject:\n\n${objectDescription}${contextBlock}`
        : `Построй интеллект-карту по следующему описанию объекта или темы:\n\n${objectDescription}${contextBlock}`;

    const chatResponse = await client.chat.complete({
      model: 'pixtral-12b-2409',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 4096,
      temperature: 0.35,
    });

    const responseContent = chatResponse.choices?.[0]?.message?.content;
    let responseText = '';
    if (typeof responseContent === 'string') {
      responseText = responseContent;
    } else if (Array.isArray(responseContent)) {
      responseText = responseContent
        .map((c) => {
          if (typeof c === 'string') return c;
          if (c && typeof c === 'object' && 'text' in c && typeof (c as { text?: string }).text === 'string') {
            return (c as { text: string }).text;
          }
          return '';
        })
        .join('');
    } else {
      responseText = String(responseContent || '');
    }

    const parsed = extractJsonObject(responseText);
    const rawItems = parsed.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: 'Модель не вернула элементы (items)' }, { status: 422 });
    }

    const baseId = `sh-${Date.now()}`;
    const items: SheetItemOut[] = [];
    let idx = 0;
    for (const r of rawItems) {
      const id = `${baseId}-${idx++}`;
      const it = normalizeItem(r, id);
      if (it) items.push(it);
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'Не удалось разобрать элементы' }, { status: 422 });
    }

    const connections: SheetConnectionOut[] = [];
    const rawConn = parsed.connections;
    if (Array.isArray(rawConn)) {
      let ci = 0;
      for (const c of rawConn) {
        if (!c || typeof c !== 'object') continue;
        const o = c as Record<string, unknown>;
        const from = Math.round(Number(o.from));
        const to = Math.round(Number(o.to));
        if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) {
          continue;
        }
        const fromHandle = normalizeHandle(o.fromHandle);
        const toHandle = normalizeHandle(o.toHandle);
        connections.push({
          id: `c-${baseId}-${ci++}`,
          fromId: items[from]!.id,
          fromHandle,
          toId: items[to]!.id,
          toHandle,
        });
      }
    }

    return NextResponse.json({ items, connections });
  } catch (e) {
    console.error('sheet-canva-mindmap:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Ошибка генерации' },
      { status: 500 }
    );
  }
}
