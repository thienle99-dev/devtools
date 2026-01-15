declare module 'browser-image-compression' {
  interface Options {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    fileType?: string;
    initialQuality?: number;
    alwaysKeepResolution?: boolean;
  }

  function imageCompression(file: File, options?: Options): Promise<File>;
  export default imageCompression;
}
