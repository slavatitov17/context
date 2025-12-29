import { NextRequest, NextResponse } from 'next/server';
import { pipeline, env } from '@xenova/transformers';

// Отключаем удаленные модели (используем локальные)
env.allowLocalModels = true;
env.allowRemoteModels = false;

// Кэш для моделей
let embeddingModel: any = null;
let textGenerationModel: any = null;

// Инициализация модели для embeddings
async function getEmbeddingModel() {
  if (!embeddingModel) {
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/multilingual-MiniLM-L12-v2',
      { quantized: true }
    );
  }
  return embeddingModel;
}

// Инициализация модели для генерации текста
// Используем Gemma 2B (Google) - не от Meta, совместима с Россией
async function getTextGenerationModel() {
  if (!textGenerationModel) {
    try {
      // Пробуем загрузить Gemma 2B (легковесная модель от Google)
      textGenerationModel = await pipeline(
        'text-generation',
        'Xenova/gemma-2-2b-it',
        { quantized: true }
      );
    } catch (error) {
      console.warn('Не удалось загрузить Gemma, используем простую генерацию:', error);
      textGenerationModel = null;
    }
  }
  return textGenerationModel;
}

// Вычисление косинусного сходства
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// RAG-система для поиска ответов в документах
export async function POST(request: NextRequest) {
  try {
    const { question, documents } = await request.json();

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'Вопрос обязателен' },
        { status: 400 }
      );
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'Документы обязательны и должны быть массивом' },
        { status: 400 }
      );
    }

    // Фильтруем документы с валидным текстом
    const validDocuments = documents.filter((doc: any) => 
      doc && doc.text && typeof doc.text === 'string' && doc.text.trim().length > 0
    );

    if (validDocuments.length === 0) {
      return NextResponse.json({
        success: true,
        answer: 'В загруженных документах нет текстового содержимого для анализа. Пожалуйста, загрузите документы с текстом.',
        found: false,
        sources: [],
      });
    }

    let bestMatches: Array<{ text: string; score: number; source: string }> = [];

    try {
      // Пробуем использовать векторный поиск через embeddings
      const embeddingModel = await getEmbeddingModel();
      
      // Создаем embedding для вопроса
      const questionEmbedding = await embeddingModel(question, {
        pooling: 'mean',
        normalize: true,
      });
      const questionVector = Array.from(questionEmbedding.data) as number[];

      // Ищем релевантные фрагменты в каждом документе
      for (const doc of validDocuments) {
        const chunks = doc.chunks && Array.isArray(doc.chunks) && doc.chunks.length > 0
          ? doc.chunks
          : splitTextIntoChunks(doc.text || '', 500);
        
        for (const chunk of chunks) {
          if (!chunk || typeof chunk !== 'string' || chunk.trim().length === 0) continue;
          
          try {
            // Создаем embedding для чанка
            const chunkEmbedding = await embeddingModel(chunk, {
              pooling: 'mean',
              normalize: true,
            });
            const chunkVector = Array.from(chunkEmbedding.data) as number[];
            
            // Вычисляем косинусное сходство
            const similarity = cosineSimilarity(questionVector, chunkVector);
            
            if (similarity > 0.3) { // Порог релевантности
              bestMatches.push({
                text: chunk,
                score: similarity * 100, // Преобразуем в проценты
                source: doc.fileName || 'Неизвестный файл',
              });
            }
          } catch (chunkError) {
            console.warn('Ошибка при обработке чанка:', chunkError);
            // Продолжаем обработку других чанков
          }
        }
      }
    } catch (error) {
      console.warn('Ошибка при векторном поиске, используем простой поиск:', error);
      
      // Fallback на простой поиск по ключевым словам
      const questionWords = question.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length > 2); // Уменьшил минимальную длину слова

      validDocuments.forEach((doc: { text: string; chunks?: string[]; fileName: string }) => {
        const chunks = doc.chunks && Array.isArray(doc.chunks) && doc.chunks.length > 0
          ? doc.chunks
          : splitTextIntoChunks(doc.text || '', 500);
        
        chunks.forEach(chunk => {
          if (!chunk || typeof chunk !== 'string') return;
          
          const chunkLower = chunk.toLowerCase();
          let score = 0;
          
          questionWords.forEach((word: string) => {
            const matches = (chunkLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
            score += matches * 2;
          });

          const questionPhrases = extractPhrases(question.toLowerCase());
          questionPhrases.forEach((phrase: string) => {
            if (chunkLower.includes(phrase)) {
              score += phrase.split(/\s+/).length * 3;
            }
          });

          if (score > 0) {
            bestMatches.push({
              text: chunk,
              score,
              source: doc.fileName || 'Неизвестный файл',
            });
          }
        });
      });
    }

    // Сортируем по релевантности и берем топ-3
    bestMatches.sort((a, b) => b.score - a.score);
    const topMatches = bestMatches.slice(0, 3);

    // Если не найдено релевантных фрагментов
    const threshold = bestMatches.length > 0 && bestMatches[0].score > 50 ? 30 : 1; // Уменьшил порог
    if (topMatches.length === 0 || topMatches[0].score < threshold) {
      // Пробуем вернуть хотя бы первые фрагменты из документов
      if (validDocuments.length > 0 && validDocuments[0].text) {
        const firstDoc = validDocuments[0];
        const firstChunks = firstDoc.chunks && Array.isArray(firstDoc.chunks) && firstDoc.chunks.length > 0
          ? firstDoc.chunks
          : splitTextIntoChunks(firstDoc.text, 500);
        
        if (firstChunks.length > 0) {
          return NextResponse.json({
            success: true,
            answer: `На основе загруженных документов: ${firstChunks[0].substring(0, 500)}${firstChunks[0].length > 500 ? '...' : ''}\n\nК сожалению, не удалось найти точный ответ на ваш вопрос. Попробуйте переформулировать вопрос или убедитесь, что документы содержат релевантную информацию.`,
            found: true,
            sources: [firstDoc.fileName || 'Неизвестный файл'],
          });
        }
      }
      
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

    // Генерация ответа с использованием LLM (если доступна) или простой генерации
    let answer: string;
    try {
      const textGenModel = await getTextGenerationModel();
      if (textGenModel) {
        // Используем LLM для генерации ответа
        const prompt = `На основе следующего контекста из документов ответь на вопрос пользователя. Если в контексте нет информации для ответа, скажи об этом.

Контекст:
${context}

Вопрос: ${question}

Ответ:`;
        
        const result = await textGenModel(prompt, {
          max_new_tokens: 200,
          temperature: 0.7,
          do_sample: true,
        });
        
        answer = result[0].generated_text.split('Ответ:')[1]?.trim() || result[0].generated_text;
      } else {
        // Fallback на простую генерацию
        answer = generateAnswerFromContext(question, context, topMatches);
      }
    } catch (error) {
      console.warn('Ошибка при генерации ответа через LLM, используем простую генерацию:', error);
      answer = generateAnswerFromContext(question, context, topMatches);
    }

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
  } catch (error: any) {
    console.error('Ошибка при поиске ответа:', error);
    const errorMessage = error?.message || 'Ошибка при поиске ответа';
    console.error('Детали ошибки:', {
      message: errorMessage,
      stack: error?.stack,
      question: question?.substring(0, 100),
      documentsCount: documents?.length,
    });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
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

