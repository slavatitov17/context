import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - pdf2json не имеет типов
import PDFParser from 'pdf2json';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Конфигурация для работы с большими файлами
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 секунд для обработки больших файлов

// Поддерживаемые форматы файлов (только текстовые)
const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.pdf', '.docx', '.xlsx', '.xls', '.xlsm', '.csv'];

async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.'));

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    switch (extension) {
      case '.txt':
      case '.md':
      case '.markdown':
        return buffer.toString('utf-8');

      case '.pdf':
        // Используем pdf2json для извлечения текста из PDF (работает в Node.js без браузерных API)
        return new Promise((resolve, reject) => {
          const pdfParser = new (PDFParser as any)(null, true);
          
          pdfParser.on('pdfParser_dataError', (errData: any) => {
            reject(new Error(`Ошибка парсинга PDF: ${errData.parserError}`));
          });
          
          pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            try {
              // Извлекаем текст из всех страниц
              let fullText = '';
              if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
                pdfData.Pages.forEach((page: any) => {
                  if (page.Texts && Array.isArray(page.Texts)) {
                    page.Texts.forEach((textItem: any) => {
                      if (textItem.R && Array.isArray(textItem.R)) {
                        textItem.R.forEach((run: any) => {
                          if (run.T) {
                            // Декодируем URL-encoded текст с обработкой ошибок
                            try {
                              // Пробуем декодировать, если не получается - используем исходный текст
                              const decoded = decodeURIComponent(run.T);
                              fullText += decoded + ' ';
                            } catch (e) {
                              // Если декодирование не удалось, используем исходный текст
                              fullText += run.T + ' ';
                            }
                          }
                        });
                      }
                    });
                  }
                });
              }
              resolve(fullText.trim());
            } catch (error) {
              reject(new Error(`Ошибка при извлечении текста: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`));
            }
          });
          
          pdfParser.parseBuffer(buffer);
        });

      case '.docx':
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;

      case '.doc':
        throw new Error('Формат .doc не поддерживается. Пожалуйста, используйте .docx');

      case '.xlsx':
      case '.xls':
      case '.xlsm':
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let excelText = '';
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          excelText += `\n--- Лист: ${sheetName} ---\n`;
          excelText += XLSX.utils.sheet_to_txt(sheet);
        });
        return excelText;

      case '.csv':
        const csvText = buffer.toString('utf-8');
        const csvLines = csvText.split('\n').filter(line => line.trim());
        return csvLines.join('\n');

      default:
        throw new Error(`Неподдерживаемый формат файла: ${extension}`);
    }
  } catch (error) {
    throw new Error(`Ошибка при обработке файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Логируем для отладки
    console.log('POST /api/documents/process called');
    console.log('Content-Type:', request.headers.get('content-type'));
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    console.log('File received:', file ? file.name : 'null');

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не предоставлен' },
        { status: 400 }
      );
    }

    // Проверяем формат файла
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf('.'));

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: `Неподдерживаемый формат файла: ${extension}. Поддерживаются: ${SUPPORTED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Извлекаем текст из файла
    const text = await extractTextFromFile(file);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Не удалось извлечь текст из файла' },
        { status: 400 }
      );
    }

    // Разбиваем текст на чанки (для RAG)
    const chunkSize = 1000; // символов
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    return NextResponse.json({
      fileName: file.name,
      text,
      chunks,
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error('Ошибка при обработке документа:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка при обработке документа' },
      { status: 500 }
    );
  }
}
