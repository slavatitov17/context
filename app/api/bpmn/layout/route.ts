import { NextRequest, NextResponse } from 'next/server';

/** Удаляет XML-комментарии и лишние обёртки (```xml ... ```) из строки. */
function normalizeBpmnXml(xml: string): string {
  let out = xml.trim();
  const xmlMatch = out.match(/```(?:xml|bpmn)?\s*\n?([\s\S]*?)```/i) || out.match(/(<\?xml[\s\S]*?<\/bpmn:definitions>)/i);
  if (xmlMatch) {
    out = (xmlMatch[1] || xmlMatch[0]).trim();
  }
  if (!out.startsWith('<?xml')) {
    out = out.replace(/^[\s\S]*?(<\?xml)/i, '$1');
  }
  out = out.replace(/<!--[\s\S]*?-->/g, '');
  return out.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const raw = typeof body.xml === 'string' ? body.xml : typeof body.bpmnXml === 'string' ? body.bpmnXml : '';
    const xml = normalizeBpmnXml(raw);
    if (!xml || !xml.includes('bpmn:definitions')) {
      return NextResponse.json({ error: 'Неверный BPMN XML' }, { status: 400 });
    }
    const { layoutProcess } = await import('bpmn-auto-layout');
    const laidOut = await layoutProcess(xml);
    return NextResponse.json({ xml: laidOut });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('BPMN layout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
