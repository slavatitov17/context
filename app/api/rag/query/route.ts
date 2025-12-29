import { NextRequest, NextResponse } from 'next/server';

// RAG-система для поиска ответов в документах
export async function POST(request: NextRequest) {
  try {
    const { question, documents } = await request.json();

    if (!question || !documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: 'Вопрос и документы обязательны' },
        { status: 400 }
      );
    }

    // Простой поиск по ключевым словам вопроса в документах
    const questionWords = question.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 3);

    let bestMatches: Array<{ text: string; score: number; source: string }> = [];

    // Ищем релевантные фрагменты в каждом документе
    documents.forEach((doc: { text: string; chunks?: string[]; fileName: string }) => {
      const chunks = doc.chunks || splitTextIntoChunks(doc.text || '', 500);
      
      chunks.forEach(chunk => {
        const chunkLower = chunk.toLowerCase();
        let score = 0;
        
        // Подсчитываем совпадения ключевых слов
        questionWords.forEach((word: string) => {
          const matches = (chunkLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
          score += matches * 2; // Каждое точное совпадение слова
        });

        // Бонус за совпадение фраз
        const questionPhrases = extractPhrases(question.toLowerCase());
        questionPhrases.forEach((phrase: string) => {
          if (chunkLower.includes(phrase)) {
            score += phrase.split(/\s+/).length * 3; // Бонус за фразы
          }
        });

        if (score > 0) {
          bestMatches.push({
            text: chunk,
            score,
            source: doc.fileName,
          });
        }
      });
    });

    // Сортируем по релевантности и берем топ-3
    bestMatches.sort((a, b) => b.score - a.score);
    const topMatches = bestMatches.slice(0, 3);

    // Если не найдено релевантных фрагментов
    if (topMatches.length === 0 || topMatches[0].score < 2) {
      return NextResponse.json({
        success: true,
        answer: 'В загруженных источниках не найдено информации, которая могла бы ответить на ваш вопрос. Пожалуйста, убедитесь, что документы содержат релевантную информацию, или переформулируйте вопрос.',
        found: false,
        sources: [],
      });
    }

    // Формируем ответ на основе найденных фрагментов
    const context = topMatches.map(m => m.text).join('\n\n');
    const sources = Array.from(new Set(topMatches.map(m => m.source)));

    // Простая генерация ответа (можно заменить на вызов LLM)
    const answer = generateAnswerFromContext(question, context, topMatches);

    return NextResponse.json({
      success: true,
      answer,
      found: true,
      sources,
      relevantChunks: topMatches.map(m => ({
        text: m.text.substring(0, 200) + '...',
        source: m.source,
      })),
    });
  } catch (error) {
    console.error('Ошибка при поиске ответа:', error);
    return NextResponse.json(
      { error: 'Ошибка при поиске ответа' },
      { status: 500 }
    );
  }
}

// Разбиение текста на чанки
function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]\s+/);
  
  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

// Извлечение фраз из вопроса
function extractPhrases(text: string): string[] {
  const phrases: string[] = [];
  const words = text.split(/\s+/);
  
  // Извлекаем биграммы и триграммы
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }
  
  return phrases;
}

// Генерация ответа на основе контекста
function generateAnswerFromContext(
  question: string,
  context: string,
  matches: Array<{ text: string; score: number; source: string }>
): string {
  // Простая генерация ответа - извлечение релевантных предложений
  // В будущем можно заменить на вызов Ollama или другой LLM
  
  const sentences = context.split(/[.!?]\s+/).filter(s => s.length > 20);
  const questionLower = question.toLowerCase();
  
  // Ищем предложения, которые содержат ключевые слова вопроса
  const relevantSentences = sentences
    .filter(s => {
      const sLower = s.toLowerCase();
      const questionWords = questionLower.split(/\s+/).filter(w => w.length > 3);
      return questionWords.some(word => sLower.includes(word));
    })
    .slice(0, 3);

  if (relevantSentences.length > 0) {
    let answer = relevantSentences.join('. ');
    
    // Добавляем информацию об источниках
    const sources = Array.from(new Set(matches.map(m => m.source)));
    if (sources.length > 0) {
      answer += `\n\nИнформация взята из документов: ${sources.join(', ')}.`;
    }
    
    return answer;
  }

  // Если не нашли релевантные предложения, возвращаем первый фрагмент
  if (matches.length > 0) {
    return matches[0].text.substring(0, 500) + 
      (matches[0].text.length > 500 ? '...' : '') +
      `\n\nИсточник: ${matches[0].source}`;
  }

  return 'На основе загруженных документов: ' + context.substring(0, 500);
}

