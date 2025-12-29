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
// Используем Mistral 7B (Mistral AI) - французская компания, работает быстро в России
async function getTextGenerationModel() {
  if (!textGenerationModel) {
    try {
      // Загружаем Mistral 7B Instruct
      console.log('Загрузка модели Mistral 7B Instruct...');
      textGenerationModel = await pipeline(
        'text-generation',
        'Xenova/Mistral-7B-Instruct-v0.2',
        { quantized: true }
      );
      console.log('Модель Mistral 7B успешно загружена');
    } catch (error: any) {
      console.warn('Не удалось загрузить Mistral, используем простую генерацию:', error?.message || error);
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
export async function POST(request: NextRequest): Promise<NextResponse> {
  let question: string | undefined;
  let documents: any[] | undefined;
  
  try {
    const body = await request.json();
    question = body.question;
    documents = body.documents;

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

    // Сначала пробуем простой поиск (более надежный)
    // Векторный поиск может не работать из-за ограничений Vercel
    try {
      if (!question) {
        throw new Error('Вопрос не определен');
      }
      
      console.log('Используем простой поиск по ключевым словам');
      const questionLower = question.toLowerCase();
      const questionWords = questionLower
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length > 2);
      const questionPhrases = extractPhrases(questionLower);
      console.log(`Ключевые слова: ${questionWords.join(', ')}, фраз: ${questionPhrases.length}`);

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
      
      console.log(`Простой поиск: найдено совпадений: ${bestMatches.length}`);
    } catch (simpleSearchError: any) {
      console.error('Ошибка при простом поиске:', simpleSearchError);
    }

    // Пробуем векторный поиск как дополнительный метод (опционально)
    try {
      console.log('Пробуем векторный поиск...');
      const embeddingModel = await getEmbeddingModel();
      console.log('Модель embeddings загружена');
      
      const questionEmbedding = await embeddingModel(question, {
        pooling: 'mean',
        normalize: true,
      });
      const questionVector = Array.from(questionEmbedding.data) as number[];
      console.log(`Embedding вопроса создан, размерность: ${questionVector.length}`);

      let processedChunks = 0;
      for (const doc of validDocuments) {
        const chunks = doc.chunks && Array.isArray(doc.chunks) && doc.chunks.length > 0
          ? doc.chunks
          : splitTextIntoChunks(doc.text || '', 500);
        
        for (const chunk of chunks) {
          if (!chunk || typeof chunk !== 'string' || chunk.trim().length === 0) continue;
          
          try {
            const chunkEmbedding = await embeddingModel(chunk, {
              pooling: 'mean',
              normalize: true,
            });
            const chunkVector = Array.from(chunkEmbedding.data) as number[];
            const similarity = cosineSimilarity(questionVector, chunkVector);
            
            if (similarity > 0.3) {
              bestMatches.push({
                text: chunk,
                score: similarity * 100,
                source: doc.fileName || 'Неизвестный файл',
              });
            }
            processedChunks++;
          } catch (chunkError: any) {
            // Игнорируем ошибки отдельных чанков
          }
        }
      }
      console.log(`Векторный поиск: обработано чанков: ${processedChunks}, найдено совпадений: ${bestMatches.length}`);
    } catch (error: any) {
      console.warn('Векторный поиск недоступен, используем результаты простого поиска:', error?.message || error);
    }

    // Сортируем по релевантности и берем топ-3
    bestMatches.sort((a, b) => b.score - a.score);
    const topMatches = bestMatches.slice(0, 3);

    // Если не найдено релевантных фрагментов, ищем по всему тексту документов
    const threshold = bestMatches.length > 0 && bestMatches[0].score > 50 ? 30 : 1;
    if (topMatches.length === 0 || topMatches[0].score < threshold) {
      console.log('Не найдено точных совпадений, ищем по всему тексту документов');
      
      // Ищем упоминания ключевых слов из вопроса во всех документах
      if (question) {
        const questionLower = question.toLowerCase();
        const searchTerms = questionLower
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter((w: string) => w.length > 3);
        
        for (const doc of validDocuments) {
          const docText = doc.text || '';
          const docLower = docText.toLowerCase();
          
          // Ищем предложения, содержащие ключевые слова
          const sentences = docText.split(/[.!?]\s+/);
          const relevantSentences = sentences.filter((sentence: string) => {
            const sentenceLower = sentence.toLowerCase();
            return searchTerms.some(term => sentenceLower.includes(term));
          });
          
          if (relevantSentences.length > 0) {
            const answerText = relevantSentences.slice(0, 3).join('. ');
            return NextResponse.json({
              success: true,
              answer: answerText + (relevantSentences.length > 3 ? '...' : ''),
              found: true,
              sources: [doc.fileName || 'Неизвестный файл'],
            });
          }
        }
      }
      
      // Если ничего не найдено, возвращаем начало первого документа
      if (validDocuments.length > 0 && validDocuments[0].text) {
        const firstDoc = validDocuments[0];
        const preview = firstDoc.text.substring(0, 300);
        return NextResponse.json({
          success: true,
          answer: `На основе документа "${firstDoc.fileName}": ${preview}${firstDoc.text.length > 300 ? '...' : ''}\n\nК сожалению, не удалось найти точный ответ на ваш вопрос в загруженных документах. Попробуйте переформулировать вопрос или убедитесь, что документы содержат релевантную информацию.`,
          found: true,
          sources: [firstDoc.fileName || 'Неизвестный файл'],
        });
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
    if (!question) {
      throw new Error('Вопрос не определен');
    }
    
    let answer: string;
    try {
      const textGenModel = await getTextGenerationModel();
      if (textGenModel) {
        // Используем LLM для генерации ответа
        // Mistral использует формат инструкций
        const prompt = `<s>[INST] На основе следующего контекста из документов ответь на вопрос пользователя. Если в контексте нет информации для ответа, скажи об этом честно.

Контекст:
${context}

Вопрос: ${question} [/INST]`;
        
        console.log('Генерируем ответ с помощью LLM...');
        const result = await textGenModel(prompt, {
          max_new_tokens: 300,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
        });
        
        // Извлекаем ответ из результата Mistral
        let generatedText = result[0]?.generated_text || '';
        
        // Очищаем ответ от промпта (Mistral формат)
        if (generatedText.includes('[/INST]')) {
          answer = generatedText.split('[/INST]')[1]?.trim() || generatedText;
        } else {
          // Берем последнюю часть (новый сгенерированный текст)
          const promptLength = prompt.length;
          answer = generatedText.substring(promptLength).trim();
        }
        
        // Очищаем от лишних символов
        answer = answer.replace(/^[\s\n]+|[\s\n]+$/g, '');
        
        if (!answer || answer.length < 10) {
          throw new Error('LLM вернул пустой или слишком короткий ответ');
        }
        
        console.log(`LLM сгенерировал ответ длиной ${answer.length} символов`);
      } else {
        // Fallback на простую генерацию
        console.log('Используем простую генерацию (LLM недоступна)');
        answer = generateAnswerFromContext(question, context, topMatches);
      }
    } catch (error: any) {
      console.warn('Ошибка при генерации ответа через LLM, используем простую генерацию:', error?.message || error);
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
      question: question ? question.substring(0, 100) : 'не определен',
      documentsCount: documents ? documents.length : 0,
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

