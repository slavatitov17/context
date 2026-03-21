// Создаем API-маршрут для RAG-запросов к документам с использованием Mistral AI для поиска релевантных фрагментов
import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

// Инициализация Mistral AI клиента
function getMistralClient(): Mistral | null {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Mistral({ apiKey });
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Слова запроса без пунктуации по краям («документе?» → «документе»), длина > 2 */
function tokenizeQueryWords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter((w) => w.length > 2);
}

type ScoredChunk = { chunk: string; keywordScore: number; index: number };

// Поиск чанков по пересечению слов запроса (без «фиктивного» балла за порядок чанков)
function scoreChunksByQuery(query: string, chunks: string[]): ScoredChunk[] {
  const queryWords = tokenizeQueryWords(query);

  return chunks.map((chunk, index) => {
    const chunkLower = chunk.toLowerCase();
    let keywordScore = 0;
    queryWords.forEach((word) => {
      const matches = (chunkLower.match(new RegExp(escapeRegExp(word), 'g')) || []).length;
      keywordScore += matches;
    });
    return { chunk, keywordScore, index };
  });
}

function findRelevantChunks(scored: ScoredChunk[], maxChunks: number = 5): string[] {
  const sorted = [...scored].sort((a, b) => {
    if (b.keywordScore !== a.keywordScore) return b.keywordScore - a.keywordScore;
    return a.index - b.index;
  });
  const withHits = sorted.filter((c) => c.keywordScore > 0);
  const pick = (withHits.length > 0 ? withHits : sorted).slice(0, maxChunks);
  return pick.map((item) => item.chunk);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, documents } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Запрос не предоставлен или имеет неверный формат' },
        { status: 400 }
      );
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'Документы не предоставлены' },
        { status: 400 }
      );
    }

    // Собираем все чанки из всех документов
    const allChunks: string[] = [];
    documents.forEach((doc: any) => {
      if (doc.chunks && Array.isArray(doc.chunks)) {
        allChunks.push(...doc.chunks);
      } else if (doc.text) {
        // Если чанки не предоставлены, разбиваем текст на чанки
        const chunkSize = 1000;
        for (let i = 0; i < doc.text.length; i += chunkSize) {
          allChunks.push(doc.text.substring(i, i + chunkSize));
        }
      }
    });

    if (allChunks.length === 0) {
      return NextResponse.json(
        { error: 'Не удалось извлечь текст из документов' },
        { status: 400 }
      );
    }

    const queryWords = tokenizeQueryWords(query);
    const scored = scoreChunksByQuery(query, allChunks);

    let relevantChunks: string[];
    if (queryWords.length === 0) {
      // Очень короткий запрос — начало документа
      relevantChunks = allChunks.slice(0, 5);
    } else {
      const bestKeyword = scored.reduce((m, c) => Math.max(m, c.keywordScore), 0);
      if (bestKeyword > 0) {
        relevantChunks = findRelevantChunks(scored, 5);
      } else {
        // Общий вопрос без совпадения по словам («что в документе», перефраз) — даём начало текста, модель отвечает по контексту
        relevantChunks = allChunks.slice(0, 5);
      }
    }

    const context = relevantChunks.join('\n\n---\n\n');

    const systemPrompt = `Ты отвечаешь в режиме RAG: опираешься только на переданный контекст (фрагменты загруженных документов).
ПРАВИЛА:
- Если вопрос общий о содержании документа (например «что указано в документе», «о чём документ», «кратко содержание») — дай сжатый ответ по тому, что реально есть в контексте.
- Если в контексте нет нужных данных для конкретного факта — скажи, что в приведённых фрагментах документов этой информации нет. Не выдумывай и не дополняй ответ фактами из общих знаний, энциклопедии, фразами «если интересно», «на самом деле» и т.п.
- Не отвлекайся на темы вне контекста.
- Язык ответа — как у вопроса пользователя.`;

    const userPrompt = `Контекст из документов:
${context}

Вопрос: ${query}

Ответь по контексту. Если контекста недостаточно для фактического ответа — укажи это; не добавляй сведений вне контекста.`;

    // Получаем клиент Mistral AI
    const client = getMistralClient();

    if (!client) {
      // Если API ключ не настроен, возвращаем простой ответ на основе контекста
      return NextResponse.json({
        answer: `На основе предоставленных документов:\n\n${context.substring(0, 500)}...\n\nДля полного ответа необходимо настроить MISTRAL_API_KEY в переменных окружения. Получите API ключ на https://console.mistral.ai/`,
        thinking: null,
      });
    }

    try {
      // Вызываем модель Mixtral через Mistral AI API
      // Используем доступные модели: pixtral-12b-2409, mistral-large-latest, или mixtral-8x22b-2409
      const chatResponse = await client.chat.complete({
        model: 'pixtral-12b-2409', // Используем Pixtral (поддерживает Mixtral архитектуру), можно заменить на 'mistral-large-latest'
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        maxTokens: 2048,
        temperature: 0.35,
      });

      // Извлекаем ответ из ответа API
      const answer = chatResponse.choices?.[0]?.message?.content || 'Не удалось получить ответ от модели';

      return NextResponse.json({
        answer: answer,
        thinking: null,
      });
    } catch (apiError) {
      console.error('Ошибка при вызове Mistral AI API:', apiError);
      
      // Fallback: возвращаем ответ на основе контекста
      return NextResponse.json({
        answer: `На основе предоставленных документов:\n\n${context.substring(0, 1000)}...\n\nОшибка при обращении к модели: ${apiError instanceof Error ? apiError.message : 'Неизвестная ошибка'}`,
        thinking: null,
      });
    }
  } catch (error) {
    console.error('Ошибка при обработке RAG запроса:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка при обработке запроса' },
      { status: 500 }
    );
  }
}
