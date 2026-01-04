import { Image } from "imagescript";
import { crc32 } from "crc32";

export type DecryptOptions = {
  aesKey: CryptoKey;
  pngEncrypted: string;
  fileOutput: string;
};

export default async function decryptPNGToFile({
  aesKey,
  pngEncrypted,
  fileOutput,
}: DecryptOptions) {
  const image = await Image.decode(await Deno.readFile(pngEncrypted));

  if (!(image instanceof Image)) {
    console.error("Unsupported image format. Please use a PNG image.");
    return;
  }

  const width = image.width;
  const height = image.height;

  // Extract the bits from the blue channel's LSB
  const dataBits: number[] = [];

  for (let y = 1; y <= height; y++) {
    for (let x = 1; x <= width; x++) {
      const color = image.getPixelAt(x, y);

      // Extract the blue component
      const b = (color >>> 16) & 0xff;

      // Get the LSB of the blue channel
      const bit = b & 1;
      dataBits.push(bit);
    }
  }

  // Convert bits to bytes
  const dataBytes: number[] = [];
  for (let i = 0; i < dataBits.length; i += 8) {
    const byteBits = dataBits.slice(i, i + 8);
    if (byteBits.length < 8) {
      break;
    }
    let byte = 0;
    for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
      byte = (byte << 1) | byteBits[bitIndex];
    }
    dataBytes.push(byte);
  }

  const data = new Uint8Array(dataBytes);

  // Extract data length (first 4 bytes, big-endian)
  if (data.length < 8) {
    console.error("Insufficient data extracted from the image.");
    return;
  }

  const dataLength = new DataView(data.buffer).getUint32(0, false); // Big-endian

  // Extract checksum (next 4 bytes)
  const checksum = new DataView(data.buffer).getUint32(4, false); // Big-endian

  // Debugging statements
  console.log("Data Length (bytes) extracted:", dataLength);
  console.log("Checksum extracted (hex):", checksum.toString(16));

  // Extract compressed data
  const compressedData = data.slice(8, 8 + dataLength);

  // Validate checksum
  const calculatedChecksumHex = crc32(compressedData);
  const calculatedChecksum = parseInt(calculatedChecksumHex, 16);
  console.log("Checksum calculated (hex):", calculatedChecksumHex);

  if (checksum !== calculatedChecksum) {
    console.error("Checksum mismatch. Data may be corrupted.");
    return;
  } else {
    console.log("Checksum verified successfully.");
  }

  try {
    // Decompress the data
    const fullEncryptedData = await decompressData(compressedData);

    // Extract IV and encrypted content
    const iv = fullEncryptedData.slice(0, 16);
    const encryptedContent = fullEncryptedData.slice(16);

    // Decrypt the data
    const decryptedData = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-CBC", iv },
        aesKey,
        encryptedContent,
      ),
    );

    await Deno.writeFile(fileOutput, decryptedData);
    console.log(`Decryption complete. File restored as ${fileOutput}`);
  } catch (error) {
    console.error("Decryption failed:", error);
  }
}

async function decompressData(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  writer.write(data.slice());
  writer.close();
  const decompressedData = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(decompressedData);
}
