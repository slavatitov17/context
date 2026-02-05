// Объявление типов для модуля bpmn-auto-layout (нет @types/bpmn-auto-layout)
declare module 'bpmn-auto-layout' {
  export function layoutProcess(xml: string): Promise<string>;
}
