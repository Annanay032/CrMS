declare module 'sharp' {
  interface Sharp {
    extract(opts: { left: number; top: number; width: number; height: number }): Sharp;
    resize(width: number, height: number, opts?: { fit?: string; position?: string }): Sharp;
    jpeg(opts?: { quality?: number }): Sharp;
    png(opts?: { quality?: number }): Sharp;
    webp(opts?: { quality?: number }): Sharp;
    toBuffer(): Promise<Buffer>;
    metadata(): Promise<{ width?: number; height?: number; format?: string }>;
  }

  interface SharpConstructor {
    (input: Buffer | string): Sharp;
  }

  const sharp: SharpConstructor;
  export default sharp;
}
