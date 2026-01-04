/**
 * Usage:
 * echo ${secret} | pngencrypt <file-input> <png-mask> <png-encrypted>
 */

import encryptFileToPNG from "./src/encryptFileToPNG.ts";
import { getKey } from "./src/getKey.ts";

// prepare/validate key for encryption usage
const aesKey = await getKey(["encrypt"]);

// Command-line arguments
const [fileInput, pngMask, pngEncrypted] = Deno.args;

if (!fileInput || !pngMask || !pngEncrypted) {
  console.error(
    "Usage: echo ${secret} | deno task encrypt <file-input> <png-mask> <png-encrypted>",
  );
  Deno.exit(1);
}

await encryptFileToPNG({
  aesKey,
  fileInput,
  pngMask,
  pngEncrypted,
});
