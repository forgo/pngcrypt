/**
 * Usage:
 * echo ${secret} | pngdecrypt <png-encrypted> <file-output>
 */

import decryptPNGToFile from "./src/decryptPNGToFile.ts";
import { getKey } from "./src/getKey.ts";

// prepare/validate key for decryption usage
const aesKey = await getKey(["decrypt"]);

// Command-line arguments
const [pngEncrypted, fileOutput] = Deno.args;

if (!pngEncrypted || !fileOutput) {
  console.error(
    "Usage: echo ${secret} | deno task decrypt <png-encrypted> <file-output>",
  );
  Deno.exit(1);
}

await decryptPNGToFile({ aesKey, pngEncrypted, fileOutput });
