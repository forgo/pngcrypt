/**
 * Encrypts the input file and embeds it into a PNG image.
 * The cover image is used to hide the data with minimal visual impact.
 * @param inputFile - The path to the file to encrypt.
 * @param aesKey - The AES key to use for encryption.
 * @param coverImagePath - The path to the cover image.
 */

import { Image } from "imagescript";
import { crc32 } from "crc32";

export type EncryptParams = {
  aesKey: CryptoKey;
  fileInput: string;
  pngMask: string;
  pngEncrypted: string;
};

export default async function encryptFileToPNG({
  aesKey,
  fileInput,
  pngMask,
  pngEncrypted,
}: EncryptParams) {
  // Read and encrypt the input file
  const fileData = await Deno.readFile(fileInput);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encryptedData = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-CBC", iv }, aesKey, fileData)
  );

  // Combine IV and encrypted data
  const fullEncryptedData = new Uint8Array([...iv, ...encryptedData]);

  // Compress the data using gzip
  const compressedData = await compressData(fullEncryptedData);

  // Calculate CRC32 checksum of the compressed data
  const checksumHex = crc32(compressedData);
  const checksum = parseInt(checksumHex, 16);
  const checksumBytes = new Uint8Array(4);
  new DataView(checksumBytes.buffer).setUint32(0, checksum, false); // Big-endian

  // Convert the compressed data length to 32-bit unsigned integer (big-endian)
  const dataLength = compressedData.length;
  const dataLengthBytes = new Uint8Array(4);
  new DataView(dataLengthBytes.buffer).setUint32(0, dataLength, false); // Big-endian

  // Combine data length, checksum, and compressed data
  const dataToEmbed = new Uint8Array([
    ...dataLengthBytes,
    ...checksumBytes,
    ...compressedData,
  ]);

  // Convert the data to a bit array
  const dataBits: number[] = [];
  for (let i = 0; i < dataToEmbed.length; i++) {
    const byte = dataToEmbed[i];
    for (let bitIndex = 7; bitIndex >= 0; bitIndex--) {
      const bit = (byte >> bitIndex) & 1;
      dataBits.push(bit);
    }
  }

  // Load the cover image
  const image = await Image.decode(await Deno.readFile(pngMask));

  if (!(image instanceof Image)) {
    console.error("Unsupported image format. Please use a PNG image.");
    return;
  }

  const width = image.width;
  const height = image.height;

  // Each pixel can store 1 bit (we'll use the blue channel's LSB)
  const bitsPerPixel = 1;
  const totalAvailableBits = width * height * bitsPerPixel;

  // Debugging statements
  console.log("Compressed Data Length (bytes):", dataLength);
  console.log("Checksum (encryption):", checksumHex);
  console.log("Total Bits to Embed:", dataBits.length);
  console.log("Total Available Bits:", totalAvailableBits);

  if (dataBits.length > totalAvailableBits) {
    console.error(
      "Data is too large to embed in the provided image. Please use a larger cover image or compress the data further."
    );
    return;
  }

  // Embed the bits into the blue channel's LSB of the image data
  let dataBitIndex = 0;

  for (let y = 1; y <= height && dataBitIndex < dataBits.length; y++) {
    for (let x = 1; x <= width && dataBitIndex < dataBits.length; x++) {
      const color = image.getPixelAt(x, y);

      // Extract RGBA components (assuming ABGR format)
      const a = (color >>> 24) & 0xff;
      const b = (color >>> 16) & 0xff;
      const g = (color >>> 8) & 0xff;
      const r = color & 0xff;

      // Modify the LSB of the blue channel
      const bit = dataBits[dataBitIndex];
      const newB = (b & 0xfe) | bit;
      dataBitIndex++;

      // Reconstruct the color
      const newColor = (a << 24) | (newB << 16) | (g << 8) | r;

      image.setPixelAt(x, y, newColor);
    }
  }

  const outputImageData = await image.encode(0); // 0 for PNG
  await Deno.writeFile(pngEncrypted, outputImageData);

  console.log(`Encryption complete. Image saved as ${pngEncrypted}`);
}

async function compressData(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  const compressedData = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(compressedData);
}
