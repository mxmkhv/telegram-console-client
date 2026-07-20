import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileAsync = promisify(execFile);

// Generous cap so large screenshots captured as raw bytes aren't truncated.
const MAX_BUFFER = 64 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".heic",
  ".heif",
  ".tiff",
  ".tif",
]);

/** A resolved clipboard image, or a reason it couldn't be resolved. */
export interface ClipboardImageResult {
  path?: string;
  error?: string;
  /** True when the file was written by us and can be deleted after use. */
  isTemp?: boolean;
}

async function tryRun(
  cmd: string,
  args: string[],
  opts: { encoding?: "buffer" } = {},
): Promise<{ stdout: string | Buffer } | null> {
  try {
    return await execFileAsync(cmd, args, { maxBuffer: MAX_BUFFER, ...opts });
  } catch {
    return null;
  }
}

async function writeTempImage(bytes: Buffer, ext: string): Promise<string> {
  const path = join(tmpdir(), `tg-clip-${Date.now()}.${ext}`);
  await writeFile(path, bytes);
  return path;
}

function extFromMime(mime: string): string {
  const sub = mime.split("/")[1]?.toLowerCase() ?? "png";
  if (sub === "jpeg") return "jpg";
  return sub.replace(/[^a-z0-9]/g, "") || "png";
}

// Parse a text/uri-list payload (e.g. "file:///Users/me/a%20b.png") into a path.
function parseFileUri(data: string | undefined): string | undefined {
  if (!data) return undefined;
  const line = data
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find((s) => s.startsWith("file://"));
  if (!line) return undefined;
  try {
    return decodeURIComponent(new URL(line).pathname);
  } catch {
    return undefined;
  }
}

// macOS: one AppleScript handles both a file copied in Finder («class furl»)
// and raw image data / screenshots («class PNGf»), writing the latter to a
// temp file itself and returning a path either way.
const MAC_APPLESCRIPT = `
on run
	set imagePath to ""
	try
		set theFile to (the clipboard as «class furl»)
		set imagePath to POSIX path of theFile
	on error
		try
			set pngData to (the clipboard as «class PNGf»)
			set tmpFolder to (POSIX path of (path to temporary items from user domain))
			set tmpPath to tmpFolder & "tg-clip-" & (do shell script "date +%s") & ".png"
			set fileRef to (open for access (POSIX file tmpPath) with write permission)
			write pngData to fileRef
			close access fileRef
			set imagePath to "tmp:" & tmpPath
		end try
	end try
	return imagePath
end run
`;

async function macClipboardImage(): Promise<ClipboardImageResult> {
  const out = await tryRun("osascript", ["-e", MAC_APPLESCRIPT]);
  if (!out) return {};
  const path = out.stdout.toString().trim();
  if (!path) return {};
  if (path.startsWith("tmp:")) return { path: path.slice(4), isTemp: true };
  return { path };
}

// Windows: PowerShell reads a copied file (GetFileDropList) or image data
// (GetImage), saving the image to a temp PNG and printing the resulting path.
// STA is required for clipboard access.
const WIN_POWERSHELL = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$files = [System.Windows.Forms.Clipboard]::GetFileDropList()
if ($files.Count -gt 0) { Write-Output $files[0]; exit }
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img -ne $null) {
  $ts = [DateTimeOffset]::Now.ToUnixTimeSeconds()
  $tmp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "tg-clip-$ts.png")
  $img.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "tmp:$tmp"
}
`;

async function windowsClipboardImage(): Promise<ClipboardImageResult> {
  const out = await tryRun("powershell.exe", [
    "-NoProfile",
    "-STA",
    "-Command",
    WIN_POWERSHELL,
  ]);
  if (!out) return {};
  const path = out.stdout.toString().trim();
  if (!path) return {};
  if (path.startsWith("tmp:")) return { path: path.slice(4), isTemp: true };
  return { path };
}

// Linux: read via wl-paste (Wayland) or xclip (X11). Prefer an image target;
// fall back to a copied file's URI. Requires the tool to be installed.
async function readViaTool(
  listArgs: string[],
  getArgs: (target: string) => string[],
  tool: string,
): Promise<ClipboardImageResult> {
  const list = await tryRun(tool, listArgs);
  if (!list) {
    return { error: `Install ${tool} to paste images from the clipboard` };
  }
  const types = list.stdout.toString().split(/\s+/).filter(Boolean);

  const imgType = types.find((t) => t.startsWith("image/"));
  if (imgType) {
    const bytes = await tryRun(tool, getArgs(imgType), { encoding: "buffer" });
    if (bytes && (bytes.stdout as Buffer).length > 0) {
      const path = await writeTempImage(bytes.stdout as Buffer, extFromMime(imgType));
      return { path, isTemp: true };
    }
  }

  if (types.includes("text/uri-list")) {
    const uri = await tryRun(tool, getArgs("text/uri-list"));
    const path = parseFileUri(uri?.stdout.toString());
    if (path) return { path };
  }

  return {};
}

async function linuxClipboardImage(): Promise<ClipboardImageResult> {
  if (process.env.WAYLAND_DISPLAY) {
    return readViaTool(
      ["--list-types"],
      (t) => ["--type", t],
      "wl-paste",
    );
  }
  return readViaTool(
    ["-selection", "clipboard", "-t", "TARGETS", "-o"],
    (t) => ["-selection", "clipboard", "-t", t, "-o"],
    "xclip",
  );
}

/**
 * Reads an image from the system clipboard and resolves it to a file on disk.
 * Supports macOS, Windows, and Linux (X11/Wayland). Returns `{ path }` on
 * success, `{ error }` with a hint when a required tool is missing, or `{}`
 * when the clipboard holds no image.
 */
export async function getClipboardImage(): Promise<ClipboardImageResult> {
  let result: ClipboardImageResult;
  switch (process.platform) {
    case "darwin":
      result = await macClipboardImage();
      break;
    case "win32":
      result = await windowsClipboardImage();
      break;
    case "linux":
      result = await linuxClipboardImage();
      break;
    default:
      return { error: "Clipboard images aren't supported on this platform" };
  }

  if (!result.path) return result;

  const dot = result.path.lastIndexOf(".");
  const ext = dot >= 0 ? result.path.slice(dot).toLowerCase() : "";
  if (!IMAGE_EXTENSIONS.has(ext)) return {};
  return result;
}
