declare module 'plantuml-encoder' {
  interface PlantUmlEncoder {
    encode(text: string): string;
    decode(encoded: string): string;
  }
  
  const plantumlEncoder: PlantUmlEncoder;
  export = plantumlEncoder;
}




