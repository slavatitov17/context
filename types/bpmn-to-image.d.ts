declare module 'bpmn-to-image' {
  interface Conversion {
    input: string;
    outputs: string[];
  }

  interface ConvertAllOptions {
    minDimensions?: string;
    footer?: boolean;
    title?: boolean | string;
    deviceScaleFactor?: number;
  }

  export function convertAll(
    conversions: Conversion[],
    options?: ConvertAllOptions
  ): Promise<void>;

  export function convert(input: string, output: string): Promise<void>;
}
