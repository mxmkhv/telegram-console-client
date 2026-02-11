#!/usr/bin/env bun
/**
 * Release script for Claude Code environments where `gh` CLI is unavailable
 * and git push requires `claude/` branch prefixes with a session ID.
 *
 * Usage: bun run scripts/claude-release.ts [patch|minor|major] <session-id>
 *
 * Flow:
 * 1. Ensure working directory is clean
 * 2. Fetch latest main
 * 3. Create claude/release-<type>-<session-id> branch
 * 4. Bump version (npm version)
 * 5. Push branch
 * 6. Create PR via GitHub REST API (using GH_TOKEN)
 *
 * After PR is merged, the release workflow auto-publishes to npm.
 */

const RELEASE_TYPES = ["patch", "minor", "major"] as const;
type ReleaseType = (typeof RELEASE_TYPES)[number];

async function exec(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(cmd, {
    stdout: "pipe",
    stderr: "pipe",
  });
  const output = await new Response(proc.stdout).text();
  const error = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`Command failed: ${cmd.join(" ")}\n${error}`);
  }
  return output.trim();
}

async function createPR(options: {
  title: string;
  body: string;
  head: string;
  base: string;
  token: string;
  repo: string;
}): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${options.repo}/pulls`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: options.title,
        body: options.body,
        head: options.head,
        base: options.base,
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Failed to create PR: ${response.status} ${JSON.stringify(data)}`,
    );
  }
  return data.html_url;
}

async function main() {
  const releaseType = process.argv[2] as ReleaseType;
  const sessionId = process.argv[3];

  if (!RELEASE_TYPES.includes(releaseType) || !sessionId) {
    console.error(
      `Usage: bun run scripts/claude-release.ts [${RELEASE_TYPES.join("|")}] <session-id>`,
    );
    process.exit(1);
  }

  const ghToken = process.env.GH_TOKEN;
  if (!ghToken) {
    console.error("❌ GH_TOKEN environment variable is required.");
    process.exit(1);
  }

  console.log(`\n🚀 Starting ${releaseType} release (Claude mode)...\n`);

  // 1. Check for clean working directory
  console.log("📋 Checking working directory...");
  const status = await exec(["git", "status", "--porcelain"]);
  if (status) {
    console.error(
      "❌ Working directory is not clean. Commit or stash changes first.",
    );
    process.exit(1);
  }

  // 2. Fetch latest and ensure we're on main
  console.log("📥 Fetching latest from origin...");
  await exec(["git", "fetch", "origin", "main"]);

  const currentBranch = await exec(["git", "branch", "--show-current"]);
  if (currentBranch !== "main") {
    console.log("📌 Switching to main...");
    await exec(["git", "checkout", "main"]);
  }

  await exec(["git", "pull", "origin", "main"]);

  // 3. Get current version
  const pkgJson = await Bun.file("package.json").json();
  const currentVersion = pkgJson.version;
  console.log(`📦 Current version: ${currentVersion}`);

  // 4. Create release branch
  const branchName = `claude/release-${releaseType}-${sessionId}`;
  console.log(`🌿 Creating branch: ${branchName}`);

  try {
    await exec(["git", "branch", "-D", branchName]);
  } catch {
    // Branch doesn't exist, that's fine
  }
  await exec(["git", "checkout", "-b", branchName]);

  // 5. Bump version
  console.log(`⬆️  Bumping ${releaseType} version...`);
  const versionOutput = await exec([
    "npm",
    "version",
    releaseType,
    "--no-git-tag-version",
  ]);
  const newVersion = versionOutput.replace("v", "");
  console.log(`📦 New version: ${newVersion}`);

  // 6. Commit the version bump
  await exec(["git", "add", "package.json"]);
  await exec(["git", "commit", "-m", `chore: bump version to ${newVersion}`]);

  // 7. Push branch
  console.log("📤 Pushing branch...");
  await exec(["git", "push", "-u", "origin", branchName, "--force"]);

  // 8. Detect repo from git remote
  const remoteUrl = await exec(["git", "remote", "get-url", "origin"]);
  const repoMatch = remoteUrl.match(/github\.com[/:](.+?)(?:\.git)?$/);
  // Fallback: extract from proxy URL pattern (e.g. .../git/owner/repo)
  const repo =
    repoMatch?.[1] ??
    remoteUrl.match(/\/git\/(.+?)(?:\.git)?$/)?.[1] ??
    "";
  if (!repo) {
    throw new Error(`Could not detect repo from remote URL: ${remoteUrl}`);
  }

  // 9. Create PR via GitHub API
  console.log("🔗 Creating PR...");
  const prBody = `## Release ${newVersion}

Bumps version from ${currentVersion} to ${newVersion} (${releaseType} release).

### After merging

Publishing to npm, git tagging, and GitHub Release creation are handled automatically by the release workflow.`;

  const prUrl = await createPR({
    title: `chore: release ${newVersion}`,
    body: prBody,
    head: branchName,
    base: "main",
    token: ghToken,
    repo,
  });

  console.log(`\n✅ Release PR created: ${prUrl}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review and merge the PR`);
  console.log(`   2. The release workflow will auto-publish to npm`);
}

main().catch((err) => {
  console.error("❌ Release failed:", err.message);
  process.exit(1);
});
