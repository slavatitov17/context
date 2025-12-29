import { NextRequest, NextResponse } from 'next/server';
import { pipeline, env } from '@xenova/transformers';

// Отключаем удаленные модели (используем локальные)
env.allowLocalModels = true;
env.allowRemoteModels = false;

// Кэш для модели embeddings
let embeddingModel: any = null;

// Инициализация модели для создания embeddings
async function getEmbeddingModel() {
  if (!embeddingModel) {
    // Используем легковесную модель для embeddings
    // multilingual-MiniLM-L12-v2 - поддерживает русский язык
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/multilingual-MiniLM-L12-v2',
      {
        quantized: true,
      }
    );
  }
  return embeddingModel;
}

// Создание векторных представлений для текста
export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'Тексты не предоставлены' },
        { status: 400 }
      );
    }

    const model = await getEmbeddingModel();
    const embeddings: number[][] = [];

    // Создаем embeddings для каждого текста
    for (const text of texts) {
      if (!text || typeof text !== 'string') continue;
      
      const result = await model(text, {
        pooling: 'mean',
        normalize: true,
      });
      
      // Извлекаем вектор
      const embedding = Array.from(result.data) as number[];
      embeddings.push(embedding);
    }

    return NextResponse.json({
      success: true,
      embeddings,
    });
  } catch (error) {
    console.error('Ошибка при создании embeddings:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании векторных представлений' },
      { status: 500 }
    );
  }
}

