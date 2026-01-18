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

// Простая функция поиска релевантных чанков
function findRelevantChunks(query: string, chunks: string[], maxChunks: number = 5): string[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  // Подсчитываем релевантность каждого чанка
  const scoredChunks = chunks.map((chunk, index) => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    
    queryWords.forEach(word => {
      const matches = (chunkLower.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    });

    // Бонус за начало чанка (первые чанки часто более важны)
    score += (chunks.length - index) * 0.1;

    return { chunk, score, index };
  });

  // Сортируем по релевантности и берем топ чанки
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, maxChunks).map(item => item.chunk);
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

    // Находим релевантные чанки
    const relevantChunks = findRelevantChunks(query, allChunks, 5);
    const context = relevantChunks.join('\n\n---\n\n');

    // Формируем промпт для модели
    const systemPrompt = `Ты помощник, который отвечает на вопросы пользователя на основе предоставленных документов. 
Если ответа нет в документах, честно скажи об этом. Отвечай на русском языке, если вопрос задан на русском.`;

    const userPrompt = `Используй следующую информацию из документов для ответа на вопрос пользователя.

Документы:
${context}

Вопрос: ${query}

Ответ:`;

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
        temperature: 0.7,
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
