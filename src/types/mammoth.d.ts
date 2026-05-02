declare module "mammoth/mammoth.browser" {
  export interface MammothOptions {
    arrayBuffer: ArrayBuffer;
  }
  export interface MammothMessage {
    type: string;
    message: string;
  }
  export interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }
  export interface ConvertOptions {
    styleMap?: string[] | string;
    includeDefaultStyleMap?: boolean;
    includeEmbeddedStyleMap?: boolean;
  }
  export function convertToHtml(
    input: MammothOptions,
    options?: ConvertOptions
  ): Promise<MammothResult>;
  export function extractRawText(
    input: MammothOptions
  ): Promise<MammothResult>;
}
