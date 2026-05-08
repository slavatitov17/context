import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

function getMistralClient(): Mistral | null {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return null;
  return new Mistral({ apiKey });
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
  const color =
    typeof o.color === 'string' && o.color.length > 0 ? String(o.color).slice(0, 32) : '#0f172a';
  const bgRaw = typeof o.backgroundColor === 'string' ? o.backgroundColor.trim() : '';
  const backgroundColor =
    bgRaw.length > 0
      ? bgRaw.slice(0, 32)
      : kind === 'element'
        ? '#e2e8f0'
        : 'transparent';
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

    const systemPrompt =
      language === 'en'
        ? `You output ONLY valid JSON (no markdown, no commentary) for a canvas mind map editor.
The canvas logical size is width 760px, height 1080px. All items must fit inside: x>=10, y>=10, x+width<=750, y+height<=1070.
Use "element" kind for topic boxes (rounded rectangles with backgroundColor) and optionally "text" for short labels.
Create 6–14 items: one central root element in the upper-middle area, branches arranged in a readable mind-map style (not all stacked on one line).
Connections: array of edges between item INDICES (0-based) as they appear in the "items" array. Use fromHandle and toHandle as integers 0–3 where 0=top center, 1=right, 2=bottom, 3=left of the box.
JSON shape exactly:
{"items":[{"kind":"element","text":"...","x":...,"y":...,"width":...,"height":...,"fontId":"sans","color":"#0f172a","backgroundColor":"#e2e8f0","fontSize":14},...],"connections":[{"from":0,"fromHandle":2,"to":1,"toHandle":0},...]}
fontId must be one of: sans, serif, mono. Colors as #RRGGBB or "transparent" for text backgrounds.`
        : `Ты возвращаешь ТОЛЬКО валидный JSON (без markdown, без пояснений) для редактора интеллект-карты на холсте.
Логический размер листа: ширина 760 px, высота 1080 px. Все элементы должны помещаться: x>=10, y>=10, x+width<=750, y+height<=1070.
Используй kind "element" для блоков тем (прямоугольники с backgroundColor) и при необходимости "text" для коротких подписей.
Создай 6–14 элементов: один корневой элемент по центру верхней части, ветви в виде читаемой mind map (не в одну линию).
Связи: массив рёбер между ИНДЕКСАМИ элементов в массиве "items" (с нуля). fromHandle и toHandle — целые 0–3: 0 — середину верхней стороны, 1 — право, 2 — низ, 3 — лево блока.
Точная форма JSON:
{"items":[{"kind":"element","text":"...","x":...,"y":...,"width":...,"height":...,"fontId":"sans","color":"#0f172a","backgroundColor":"#e2e8f0","fontSize":14},...],"connections":[{"from":0,"fromHandle":2,"to":1,"toHandle":0},...]}
fontId: только sans, serif или mono. Цвета в виде #RRGGBB; для фона текста можно "transparent". Все подписи на русском.`;

    const userPrompt =
      language === 'en'
        ? `Build a mind map for the following subject:\n\n${objectDescription}`
        : `Построй интеллект-карту по следующему описанию объекта или темы:\n\n${objectDescription}`;

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
