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

function injectLaneShapesIntoDi(xml: string): string {
  const processMatch = xml.match(/<bpmn:process[^>]*>([\s\S]*?)<\/bpmn:process>/);
  const planeMatch = xml.match(/<bpmndi:BPMNPlane\s+id="([^"]+)"\s+bpmnElement="([^"]+)"\s*>([\s\S]*?)<\/bpmndi:BPMNPlane>/);
  if (!processMatch || !planeMatch) return xml;
  const processBody = processMatch[1];
  const [planeFull, planeId, planeBpmnElement, planeContent] = planeMatch;
  const lanes: { id: string; refs: string[] }[] = [];
  const laneBlockMatch = processBody.match(/<bpmn:laneSet[^>]*>([\s\S]*?)<\/bpmn:laneSet>/);
  if (!laneBlockMatch) return xml;
  for (const laneTag of laneBlockMatch[1].matchAll(/<bpmn:lane\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/bpmn:lane>/g)) {
    const refs = [...laneTag[2].matchAll(/<bpmn:flowNodeRef>([^<]+)<\/bpmn:flowNodeRef>/g)].map((m) => m[1].trim());
    lanes.push({ id: laneTag[1], refs });
  }
  if (lanes.length === 0) return xml;
  const boundsByElement: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const shape of planeContent.matchAll(/<bpmndi:BPMNShape[^>]*bpmnElement="([^"]+)"[^>]*>[\s\S]*?<dc:Bounds\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"\s*\/>/gi)) {
    boundsByElement[shape[1]] = {
      x: Number(shape[2]) || 0,
      y: Number(shape[3]) || 0,
      w: Number(shape[4]) || 40,
      h: Number(shape[5]) || 40,
    };
  }
  const PAD = 20;
  const laneShapes: string[] = [];
  for (const lane of lanes) {
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (const ref of lane.refs) {
      const b = boundsByElement[ref];
      if (b) {
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.w);
        maxY = Math.max(maxY, b.y + b.h);
      }
    }
    if (minX === 1e9) continue;
    const x = Math.max(0, minX - PAD);
    const y = Math.max(0, minY - PAD);
    const w = maxX - minX + 2 * PAD;
    const h = maxY - minY + 2 * PAD;
    laneShapes.push(
      `<bpmndi:BPMNShape id="${lane.id}_di" bpmnElement="${lane.id}"><dc:Bounds x="${x}" y="${y}" width="${w}" height="${h}"/></bpmndi:BPMNShape>`
    );
  }
  if (laneShapes.length === 0) return xml;
  const newPlaneContent = '\n      ' + laneShapes.join('\n      ') + '\n      ' + planeContent.trimStart();
  const newPlane = `<bpmndi:BPMNPlane id="${planeId}" bpmnElement="${planeBpmnElement}">${newPlaneContent}</bpmndi:BPMNPlane>`;
  return xml.replace(planeFull, newPlane);
}

function ensureBpmnEdgesInDi(xml: string): string {
  const processMatch = xml.match(/<bpmn:process[^>]*>([\s\S]*?)<\/bpmn:process>/);
  const planeMatch = xml.match(/<bpmndi:BPMNPlane\s+id="([^"]+)"\s+bpmnElement="([^"]+)"\s*>([\s\S]*?)<\/bpmndi:BPMNPlane>/);
  if (!processMatch || !planeMatch) return xml;
  const processBody = processMatch[1];
  const [, planeId, planeBpmnElement, planeContent] = planeMatch;
  if (/<bpmndi:BPMNEdge\s/i.test(planeContent)) return xml;
  const flows: { id: string; sourceRef: string; targetRef: string }[] = [];
  for (const m of processBody.matchAll(/<bpmn:sequenceFlow\s+id="([^"]+)"[^>]*\ssourceRef="([^"]+)"[^>]*\stargetRef="([^"]+)"/gi)) {
    flows.push({ id: m[1], sourceRef: m[2], targetRef: m[3] });
  }
  for (const m of processBody.matchAll(/<bpmn:sequenceFlow[^>]*\stargetRef="([^"]+)"[^>]*\ssourceRef="([^"]+)"[^>]*\sid="([^"]+)"/gi)) {
    flows.push({ id: m[3], sourceRef: m[2], targetRef: m[1] });
  }
  if (flows.length === 0) return xml;
  const boundsByElement: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const shape of planeContent.matchAll(/<bpmndi:BPMNShape[^>]*bpmnElement="([^"]+)"[^>]*>[\s\S]*?<dc:Bounds\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"\s*\/>/gi)) {
    boundsByElement[shape[1]] = {
      x: Number(shape[2]) || 0,
      y: Number(shape[3]) || 0,
      w: Number(shape[4]) || 40,
      h: Number(shape[5]) || 40,
    };
  }
  const edges: string[] = [];
  for (const flow of flows) {
    const src = boundsByElement[flow.sourceRef];
    const tgt = boundsByElement[flow.targetRef];
    if (!src || !tgt) continue;
    const x1 = Math.round(src.x + src.w / 2);
    const y1 = Math.round(src.y + src.h / 2);
    const x2 = Math.round(tgt.x + tgt.w / 2);
    const y2 = Math.round(tgt.y + tgt.h / 2);
    edges.push(
      `<bpmndi:BPMNEdge id="${flow.id}_di" bpmnElement="${flow.id}"><di:waypoint x="${x1}" y="${y1}"/><di:waypoint x="${x2}" y="${y2}"/></bpmndi:BPMNEdge>`
    );
  }
  if (edges.length === 0) return xml;
  const planeFull = planeMatch[0];
  const newPlaneContent = planeContent.trimEnd() + '\n      ' + edges.join('\n      ') + '\n    ';
  const newPlane = `<bpmndi:BPMNPlane id="${planeId}" bpmnElement="${planeBpmnElement}">${newPlaneContent}</bpmndi:BPMNPlane>`;
  return xml.replace(planeFull, newPlane);
}

function transposeDiToHorizontal(xml: string): string {
  let out = xml;
  out = out.replace(/<dc:Bounds\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"\s*\/>/g, (_: string, x: string, y: string, w: string, h: string) => {
    return `<dc:Bounds x="${y}" y="${x}" width="${h}" height="${w}"/>`;
  });
  out = out.replace(/<di:waypoint\s+x="([^"]+)"\s+y="([^"]+)"\s*\/>/g, (_: string, x: string, y: string) => {
    return `<di:waypoint x="${y}" y="${x}"/>`;
  });
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const raw = typeof body.xml === 'string' ? body.xml : typeof body.bpmnXml === 'string' ? body.bpmnXml : '';
    const xml = normalizeBpmnXml(raw);
    if (!xml || !xml.includes('bpmn:definitions')) {
      return NextResponse.json({ error: 'Неверный BPMN XML' }, { status: 400 });
    }
    const injectLanesOnly = body.injectLanesOnly === true && xml.includes('bpmndi:BPMNPlane');
    let laidOut: string;
    if (injectLanesOnly) {
      laidOut = injectLaneShapesIntoDi(xml);
      laidOut = ensureBpmnEdgesInDi(laidOut);
      laidOut = transposeDiToHorizontal(laidOut);
    } else {
      const { layoutProcess } = await import('bpmn-auto-layout');
      laidOut = await layoutProcess(xml);
      laidOut = ensureBpmnEdgesInDi(laidOut);
      laidOut = injectLaneShapesIntoDi(laidOut);
      laidOut = transposeDiToHorizontal(laidOut);
    }
    return NextResponse.json({ xml: laidOut });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('BPMN layout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
