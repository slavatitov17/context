import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// Динамический импорт pdf-parse для Node.js
async function getPdfParse() {
  try {
    // Используем dynamic import для ESM
    const pdfParseModule = await import('pdf-parse');
    const moduleAny = pdfParseModule as any;
    
    // pdf-parse экспортируется как default в ESM
    if (moduleAny.default && typeof moduleAny.default === 'function') {
      return moduleAny.default;
    }
    
    // Или как именованный экспорт
    if (typeof moduleAny === 'function') {
      return moduleAny;
    }
    
    // Или как свойство
    if (moduleAny.pdfParse && typeof moduleAny.pdfParse === 'function') {
      return moduleAny.pdfParse;
    }
    
    // Последняя попытка - используем как есть
    return moduleAny;
  } catch (error: any) {
    console.error('Ошибка при импорте pdf-parse:', error);
    console.error('Детали ошибки:', error?.message, error?.stack);
    throw new Error(`Не удалось загрузить библиотеку для обработки PDF: ${error?.message || 'Неизвестная ошибка'}`);
  }
}

// Обработка документов и извлечение текста
export async function POST(request: NextRequest): Promise<NextResponse> {
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
        // Устанавливаем переменные окружения для pdfjs-dist (используется внутри pdf-parse)
        if (typeof process !== 'undefined') {
          // Отключаем использование canvas в pdfjs-dist
          process.env.CANVAS_PREBUILT = 'false';
        }
        
        const pdfParse = await getPdfParse();
        
        // Вызываем функцию с правильными параметрами
        let pdfData;
        if (typeof pdfParse === 'function') {
          // Вызываем функцию напрямую
          pdfData = await pdfParse(buffer);
        } else {
          throw new Error('pdf-parse не является функцией');
        }
        
        if (!pdfData || !pdfData.text) {
          throw new Error('Не удалось извлечь текст из PDF');
        }
        
        text = pdfData.text;
        
        if (!text || text.trim().length === 0) {
          throw new Error('Не удалось извлечь текст из PDF. Возможно, файл содержит только изображения или защищен паролем.');
        }
      } catch (pdfError: any) {
        console.error('Ошибка при обработке PDF:', pdfError);
        console.error('Stack trace:', pdfError?.stack);
        const errorMessage = pdfError.message || 'Неизвестная ошибка';
        
        // Более информативные сообщения об ошибках
        if (errorMessage.includes('DOMMatrix') || errorMessage.includes('DOM')) {
          throw new Error('Ошибка совместимости с PDF библиотекой. Пожалуйста, попробуйте конвертировать PDF в Word или другой формат.');
        } else if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
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

