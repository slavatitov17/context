// Рендер BPMN 2.0 XML в PNG на сервере (bpmn-to-image + Puppeteer)
import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const body = await request.json();
    const { bpmnXml } = body;

    if (!bpmnXml || typeof bpmnXml !== 'string') {
      return NextResponse.json(
        { error: 'BPMN XML не предоставлен' },
        { status: 400 }
      );
    }

    if (!bpmnXml.includes('definitions') || !bpmnXml.trim()) {
      return NextResponse.json(
        { error: 'Некорректный BPMN 2.0 XML' },
        { status: 400 }
      );
    }

    const id = `bpmn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const tmpDir = tmpdir();
    inputPath = join(tmpDir, `${id}.bpmn`);
    outputPath = join(tmpDir, `${id}.png`);

    writeFileSync(inputPath, bpmnXml, 'utf8');

    const { convertAll } = await import('bpmn-to-image');

    await convertAll(
      [{ input: inputPath, outputs: [outputPath] }],
      { footer: false }
    );

    if (!existsSync(outputPath)) {
      return NextResponse.json(
        { error: 'Не удалось создать изображение BPMN' },
        { status: 500 }
      );
    }

    const pngBuffer = readFileSync(outputPath);
    const imageUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error('Ошибка рендера BPMN:', err);
    return NextResponse.json(
      {
        error: `Ошибка при рендеринге BPMN: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`,
      },
      { status: 500 }
    );
  } finally {
    try {
      if (inputPath && existsSync(inputPath)) unlinkSync(inputPath);
      if (outputPath && existsSync(outputPath)) unlinkSync(outputPath);
    } catch (_) {}
  }
}
