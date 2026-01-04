import { Image } from "imagescript";
import { assert, assertEquals } from "asserts";

// Paths to files for testing
const OUTPUT_DIR = "./e2e/output";
const ZIP_FILE = `${OUTPUT_DIR}/mock.zip`;
const MASK_FILE = `${OUTPUT_DIR}/mock_mask.png`;
const ENCRYPTED_FILE = `${OUTPUT_DIR}/encrypted.png`;
const DECRYPTED_FILE = `${OUTPUT_DIR}/decrypted.zip`;

// Mock data for the zip file
const ZIP_CONTENT = new Uint8Array([1, 2, 3, 4, 5]);

// Secret for encryption/decryption (256-bit key)
const SECRET = "a".repeat(64); // Placeholder hex key

async function createMockFiles() {
  // Ensure the output directory exists
  await Deno.mkdir(OUTPUT_DIR, { recursive: true });

  // Write the mock ZIP file
  await Deno.writeFile(ZIP_FILE, ZIP_CONTENT);

  // Create a valid PNG image for the mask using imagescript
  const maskImage = new Image(100, 100); // Create a 100x100 blank image
  maskImage.fill(0xffffffff); // Fill the image with white color (or any color you prefer)
  const pngData = await maskImage.encode(); // Encode to PNG format

  await Deno.writeFile(MASK_FILE, pngData); // Write the encoded PNG to MASK_FILE
}

async function cleanUp() {
  try {
    await Deno.remove(OUTPUT_DIR, { recursive: true });
    console.log("Cleaned up output directory.");
  } catch {
    // Ignore if the directory does not exist
  }
}

async function runCommand(cmd: string[], input: string) {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdin: "piped",
  });

  const child = command.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(input));
  writer.releaseLock();
  await child.stdin.close();

  const status = await child.status;
  if (!status.success) {
    throw new Error(`Command failed: ${cmd.join(" ")}`);
  }
}

function computeImageDifference(img1: Image, img2: Image): number {
  if (img1.width !== img2.width || img1.height !== img2.height) {
    throw new Error("Images have different dimensions");
  }

  let totalDifference = 0;

  // Adjust loops to use 1-based indexing
  for (let y = 1; y <= img1.height; y++) {
    for (let x = 1; x <= img1.width; x++) {
      const pixel1 = img1.getPixelAt(x, y);
      const pixel2 = img2.getPixelAt(x, y);

      // Extract RGBA components
      const r1 = (pixel1 >> 24) & 0xff;
      const g1 = (pixel1 >> 16) & 0xff;
      const b1 = (pixel1 >> 8) & 0xff;

      const r2 = (pixel2 >> 24) & 0xff;
      const g2 = (pixel2 >> 16) & 0xff;
      const b2 = (pixel2 >> 8) & 0xff;

      // Calculate the difference for each color channel
      const dr = Math.abs(r1 - r2);
      const dg = Math.abs(g1 - g2);
      const db = Math.abs(b1 - b2);

      totalDifference += dr + dg + db;
    }
  }

  const numPixels = img1.width * img1.height;
  const avgDifference = totalDifference / (numPixels * 3); // 3 color channels

  return avgDifference;
}

async function runEndToEndTest() {
  console.log("Creating mock files...");
  await createMockFiles();

  console.log("Encrypting mock.zip into encrypted.png...");
  await runCommand(
    [
      "deno",
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-net",
      "pngencrypt.ts",
      ZIP_FILE,
      MASK_FILE,
      ENCRYPTED_FILE,
    ],
    SECRET,
  );

  const maskInfo = await Deno.stat(MASK_FILE);
  const encryptedInfo = await Deno.stat(ENCRYPTED_FILE);

  console.log(`maskImage file size: ${maskInfo.size} bytes`);
  console.log(`encryptedImage file size: ${encryptedInfo.size} bytes`);

  console.log("Comparing mock_mask.png and encrypted.png...");

  let maskImage;
  let encryptedImage;

  try {
    maskImage = await Image.decode(await Deno.readFile(MASK_FILE));
  } catch (err) {
    console.error("Failed to decode maskImage:", err);
    return;
  }

  try {
    encryptedImage = await Image.decode(await Deno.readFile(ENCRYPTED_FILE));
  } catch (err) {
    console.error("Failed to decode encryptedImage:", err);
    return;
  }

  console.log(`maskImage dimensions: ${maskImage.width}x${maskImage.height}`);

  console.log(
    `encryptedImage dimensions: ${encryptedImage.width}x${encryptedImage.height}`,
  );

  const avgDifference = computeImageDifference(maskImage, encryptedImage);

  console.log(`Average per-channel pixel difference: ${avgDifference}`);

  const acceptableDifference = 1; // Adjust threshold as needed

  assert(
    avgDifference <= acceptableDifference,
    `Images differ more than acceptable threshold. Difference: ${avgDifference}`,
  );

  console.log("Images are visually identical within acceptable threshold.");

  console.log("Decrypting encrypted.png into decrypted.zip...");
  await runCommand(
    [
      "deno",
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-net",
      "pngdecrypt.ts",
      ENCRYPTED_FILE,
      DECRYPTED_FILE,
    ],
    SECRET,
  );

  console.log("Validating decrypted.zip matches original mock.zip...");
  const originalContent = await Deno.readFile(ZIP_FILE);
  const decryptedContent = await Deno.readFile(DECRYPTED_FILE);
  assertEquals(originalContent, decryptedContent);

  console.log("End-to-end test passed!");
}

if (import.meta.main) {
  await cleanUp();
  try {
    await runEndToEndTest();
  } finally {
    await cleanUp();
  }
}
