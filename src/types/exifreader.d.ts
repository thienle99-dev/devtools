declare module 'exifreader' {
  interface ExifData {
    [key: string]: any;
  }

  function load(buffer: ArrayBuffer | Uint8Array): ExifData;
  export default { load };
}
