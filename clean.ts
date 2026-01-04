// clean.ts
async function cleanBuildDirectory() {
  // Check if the build directory exists
  try {
    const buildInfo = await Deno.stat("./build");
    if (!buildInfo.isDirectory) {
      console.log("./build exists but is not a directory. Aborting cleanup.");
      return;
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log("No ./build directory found. Nothing to clean.");
      return;
    } else {
      console.error("Error checking ./build directory:", error);
      return;
    }
  }

  // Prompt for confirmation before deletion
  const confirmed = confirm(
    "Are you sure you want to delete the ./build directory?",
  );
  if (!confirmed) {
    console.log("Cancelled cleaning ./build directory.");
    return;
  }

  // Attempt to delete the directory
  try {
    await Deno.remove("./build", { recursive: true });
    console.log("Cleaned ./build directory.");
  } catch (error) {
    console.error("Failed to clean ./build directory:", error);
  }
}

if (import.meta.main) {
  cleanBuildDirectory();
}
