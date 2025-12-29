import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// Динамический импорт pdf-parse для Node.js
async function getPdfParse() {
  const pdfParseModule = await import('pdf-parse');
  // pdf-parse экспортирует функцию напрямую
  return pdfParseModule as any;
}

// Обработка документов и извлечение текста
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не предоставлен' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let text = '';

    // Извлечение текста в зависимости от типа файла
    if (fileName.endsWith('.pdf')) {
      try {
        // Используем pdf-parse для извлечения текста (работает в Node.js)
        const pdfParse = await getPdfParse();
        const pdfData = await (pdfParse as any)(buffer);
        text = pdfData.text;
        
        if (!text || text.trim().length === 0) {
          throw new Error('Не удалось извлечь текст из PDF. Возможно, файл содержит только изображения или защищен паролем.');
        }
      } catch (pdfError: any) {
        console.error('Ошибка при обработке PDF:', pdfError);
        const errorMessage = pdfError.message || 'Неизвестная ошибка';
        
        // Более информативные сообщения об ошибках
        if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
          throw new Error('PDF файл защищен паролем. Пожалуйста, загрузите незащищенный файл.');
        } else if (errorMessage.includes('corrupt') || errorMessage.includes('invalid')) {
          throw new Error('PDF файл поврежден или имеет неверный формат.');
        } else {
          throw new Error(`Ошибка при обработке PDF файла: ${errorMessage}`);
        }
      }
    } else if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith('.doc')) {
      // Для старых .doc файлов нужна дополнительная библиотека
      // Пока возвращаем ошибку
      return NextResponse.json(
        { error: 'Формат .doc не поддерживается. Используйте .docx' },
        { status: 400 }
      );
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.rtf') || fileName.endsWith('.odt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Неподдерживаемый формат файла' },
        { status: 400 }
      );
    }

    // Разбиваем текст на чанки для лучшей обработки
    const chunks = splitTextIntoChunks(text, 1000); // 1000 символов на чанк

    return NextResponse.json({
      success: true,
      text,
      chunks,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Ошибка при обработке документа:', error);
    const errorMessage = error?.message || 'Ошибка при обработке документа';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Разбиение текста на чанки для векторного поиска
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

