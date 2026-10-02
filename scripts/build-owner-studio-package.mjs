#!/usr/bin/env node

/**
 * Assemble a reproducible, offline owner-authoring Studio package.
 *
 * This is intentionally an explicit release operation: it requires the
 * integrator's Studio and website commit/tree IDs, refuses an existing output
 * directory, and writes a new staging directory beside that output before an
 * atomic final rename. It never edits either source checkout.
 */

import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  utimes,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORK_DIR = path.resolve(SCRIPT_DIR, '..', '..');
const DEFAULTS = {
  studio: path.join(WORK_DIR, 'studio-owner-authoring-20261002', 'TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER'),
  website: path.resolve(SCRIPT_DIR, '..'),
  scratch: 'D:/Codex-TOADAL-Owner-QA-8b9080b3491b414fadb09ccb022b838e',
  tools: path.join(WORK_DIR, 'wo000-tools'),
};

const PACKAGE_LABEL = '1.4.2-owner-authoring.1';
const PACKAGE_FOLDER = `TOADAL_Studio_${PACKAGE_LABEL}`;
const LEDGER_NAME = 'PACKAGE_SHA256.json';
const FIXED_TIME = new Date('2020-01-01T00:00:00.000Z');
const TRANSIENT_COMPONENTS = new Set([
  '.git', '.studio-history', '.history', '.snapshots', '.cache',
  '.studio-recovery', 'build', 'randomtemp', 'random-temp',
]);
const NODE_MODULE_TRANSIENT_COMPONENTS = new Set([
  '.git', '.studio-history', '.history', '.snapshots', '.cache', '.studio-recovery',
  'randomtemp', 'random-temp',
]);
const REQUIRED_LAUNCHERS = [
  'RUN_SERVER_AUDIT.bat',
  'RUN_OWNER_WEBSITE.bat',
  'LAUNCH_OWNER_WEBSITE.ps1',
  'STOP_OWNER_WEBSITE.bat',
];

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const args = { ...DEFAULTS };
  const refs = {};
  const names = new Map([
    ['--studio', 'studio'], ['--website', 'website'],
    ['--scratch', 'scratch'], ['--tools', 'tools'],
    ['--studio-head', 'studioHead'], ['--studio-tree', 'studioTree'],
    ['--website-head', 'websiteHead'], ['--website-tree', 'websiteTree'],
  ]);
  for (let i = 0; i < argv.length; i += 1) {
    const key = names.get(argv[i]);
    if (!key) fail(`Unknown argument: ${argv[i]}`);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) fail(`Missing value for ${argv[i]}`);
    i += 1;
    if (key.endsWith('Head') || key.endsWith('Tree')) refs[key] = value.toLowerCase();
    else args[key] = path.resolve(value);
  }
  for (const key of ['studioHead', 'studioTree', 'websiteHead', 'websiteTree']) {
    if (!refs[key] || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(refs[key])) {
      fail(`Pass a full SHA-1 or SHA-256 object ID with --${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.`);
    }
  }
  return { ...args, ...refs };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    windowsHide: true,
    ...options,
  });
  if (result.error) fail(`${command} could not run: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`${command} exited ${result.status}: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return result;
}

function git(root, args, options = {}) {
  return run('git', ['-C', root, ...args], options);
}

function hashBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function hashFile(filePath) {
  const bytes = await readFile(filePath);
  return { sha256: hashBytes(bytes), bytes: bytes.length };
}

async function captureRepo(root, label, expectedHead, expectedTree) {
  const actualHead = git(root, ['rev-parse', 'HEAD']).stdout.trim().toLowerCase();
  const actualTree = git(root, ['rev-parse', 'HEAD^{tree}']).stdout.trim().toLowerCase();
  if (actualHead !== expectedHead) fail(`${label} HEAD does not match the supplied --${label}-head.`);
  if (actualTree !== expectedTree) fail(`${label} HEAD tree does not match the supplied --${label}-tree.`);
  const status = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']).stdout;
  if (status.length !== 0) fail(`${label} worktree must be clean before the package is assembled.`);
  return {
    head: actualHead,
    tree: actualTree,
    worktreeClean: status.length === 0,
    worktreeStatusSha256: hashBytes(Buffer.from(status, 'utf8')),
  };
}

async function verifyCopiedEntries(entries, packageRoot) {
  for (const item of entries.values()) {
    const packagedPath = path.join(packageRoot, ...item.packagePath.split('/'));
    const [sourceDigest, packageDigest] = await Promise.all([hashFile(item.sourcePath), hashFile(packagedPath)]);
    if (sourceDigest.bytes !== packageDigest.bytes || sourceDigest.sha256 !== packageDigest.sha256) {
      fail(`Package copy differs from its frozen source entry: ${item.packagePath}`);
    }
  }
}

async function verifyInstalledDependencyTree(studioRoot) {
  const packageJson = JSON.parse(await readFile(path.join(studioRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(await readFile(path.join(studioRoot, 'package-lock.json'), 'utf8'));
  const declared = packageJson.dependencies || {};
  const locked = lock.packages?.['']?.dependencies || {};
  if (JSON.stringify(Object.entries(declared).sort()) !== JSON.stringify(Object.entries(locked).sort())) {
    fail('package.json direct dependencies do not match package-lock.json.');
  }
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (!(await stat(npmCli)).isFile()) fail(`Cannot locate npm CLI beside the current Node runtime: ${npmCli}`);
  const result = run(process.execPath, [npmCli, 'ls', '--all', '--json', '--offline'], { cwd: studioRoot, maxBuffer: 32 * 1024 * 1024 });
  const tree = JSON.parse(result.stdout);
  for (const [name, version] of Object.entries(declared)) {
    if (tree.dependencies?.[name]?.version !== version) fail(`Installed dependency does not match the declared pin: ${name}@${version}`);
  }
  return { status: 'PASS', directDependencies: declared, installedTreeValidatedOffline: true };
}

function gitPaths(root) {
  const output = git(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'buffer' }).stdout;
  return output.toString('utf8').split('\0').filter(Boolean).map((item) => item.replaceAll('\\', '/'));
}

function isTransient(relativePath) {
  const components = relativePath.split('/').filter(Boolean);
  const lower = components.map((component) => component.toLowerCase());
  const modulesIndex = lower.indexOf('node_modules');
  const transient = modulesIndex >= 0 ? NODE_MODULE_TRANSIENT_COMPONENTS : TRANSIENT_COMPONENTS;
  return lower.some((component) => transient.has(component) || /^(?:randomtemp|random-temp)(?:-|$)/.test(component));
}

function lexicalCompare(left, right) {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
}

function isStudioExcluded(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/').replace(/^\.\//, '');
  if (isTransient(normalized)) return true;
  const lower = normalized.toLowerCase();
  if (lower.startsWith('projects/owner-pilot-qa-20261002/')) return true;
  if (/^projects\/ai-test-[^/]+(?:\/|$)/i.test(normalized)) return true;
  if (lower.startsWith('studio-data/owner-launch/')) return true;
  return false;
}

function isProjectExcluded(relativePath) {
  return isTransient(relativePath);
}

function insideRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function addEntry(entries, packagePath, sourcePath, sourceRoot) {
  const normalized = packagePath.replaceAll('\\', '/').replace(/^\/+/, '');
  if (!normalized || normalized.split('/').some((part) => part === '..' || part === '.')) {
    fail(`Unsafe package path: ${packagePath}`);
  }
  const key = normalized.toLowerCase();
  const resolvedSource = await realpath(sourcePath);
  const resolvedRoot = await realpath(sourceRoot);
  if (!insideRoot(resolvedRoot, resolvedSource)) fail(`Source link escapes its allowed root: ${sourcePath}`);
  const previous = entries.get(key);
  if (previous) {
    if (previous.packagePath !== normalized || previous.sourcePath !== resolvedSource) {
      fail(`Two source files collide at package path ${normalized}`);
    }
    return;
  }
  const info = await stat(resolvedSource);
  if (!info.isFile()) fail(`Expected a file at ${sourcePath}`);
  entries.set(key, { packagePath: normalized, sourcePath: resolvedSource });
}

async function addTree(entries, sourceRoot, sourcePath, packagePrefix, filter = () => true, ancestors = new Set()) {
  const resolved = await realpath(sourcePath);
  const resolvedRoot = await realpath(sourceRoot);
  if (!insideRoot(resolvedRoot, resolved)) fail(`Source link escapes its allowed root: ${sourcePath}`);
  const info = await stat(resolved);
  if (info.isDirectory()) {
    if (ancestors.has(resolved)) fail(`Directory link cycle at ${sourcePath}`);
    const nextAncestors = new Set(ancestors).add(resolved);
    const children = await readdir(resolved, { withFileTypes: true });
    children.sort((a, b) => lexicalCompare(a.name, b.name));
    for (const child of children) {
      const rel = `${packagePrefix}/${child.name}`;
      if (!filter(rel)) continue;
      await addTree(entries, sourceRoot, path.join(resolved, child.name), rel, filter, nextAncestors);
    }
    return;
  }
  if (!info.isFile()) fail(`Unsupported filesystem entry: ${sourcePath}`);
  if (filter(packagePrefix)) await addEntry(entries, packagePrefix, resolved, sourceRoot);
}

async function addGitSelectedFiles(entries, root, paths, includePath, destinationForPath, excluded) {
  for (const relativePath of paths) {
    if (!includePath(relativePath) || excluded(relativePath)) continue;
    const sourcePath = path.join(root, ...relativePath.split('/'));
    try {
      await lstat(sourcePath);
    } catch (error) {
      if (error.code === 'ENOENT') continue; // A tracked deletion is not part of the worktree snapshot.
      throw error;
    }
    await addTree(entries, root, sourcePath, destinationForPath(relativePath), (candidate) => !isTransient(candidate));
  }
}

async function copyEntries(entries, packageRoot) {
  const ordered = [...entries.values()].sort((a, b) => lexicalCompare(a.packagePath, b.packagePath));
  for (const item of ordered) {
    const target = path.join(packageRoot, ...item.packagePath.split('/'));
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(item.sourcePath, target);
    await utimes(target, FIXED_TIME, FIXED_TIME);
  }
  return ordered;
}

function addExplicitTool(entries, sourcePath, packagePath, sourceRoot) {
  return addEntry(entries, packagePath, sourcePath, sourceRoot);
}

async function selectToolFiles(entries, toolsRoot) {
  const zipRoot = path.join(toolsRoot, 'zip');
  const unzipRoot = path.join(toolsRoot, 'unzip');
  const imageRoot = path.join(toolsRoot, 'imagemagick-release');
  const records = [];

  const zipFiles = ['zip.exe', 'LICENSE', 'README', 'README.CR', 'WHATSNEW', 'WHERE', 'Contents', 'zip.txt', 'zip30.ann'];
  const unzipFiles = ['unzip.exe', 'LICENSE', 'README', 'README.NT', 'WHERE', 'unzip.txt'];
  for (const [tool, root, files] of [['zip', zipRoot, zipFiles], ['unzip', unzipRoot, unzipFiles]]) {
    const copied = [];
    for (const name of files) {
      const source = path.join(root, name);
      try {
        await stat(source);
      } catch (error) {
        if (error.code === 'ENOENT' && name !== (tool === 'zip' ? 'zip.exe' : 'unzip.exe')) continue;
        fail(`Required ${tool} package file is missing: ${source}`);
      }
      await addExplicitTool(entries, source, `tools/${tool}/${name}`, root);
      copied.push(name);
    }
    records.push({
      tool,
      sourceWorkspaceRelativeDirectory: `work/wo000-tools/${path.basename(root)}`,
      copiedFiles: copied,
    });
  }

  const imageNames = (await readdir(imageRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && (
      entry.name.toLowerCase() === 'magick.exe' ||
      entry.name.toLowerCase().endsWith('.xml') ||
      ['license.txt', 'notice.txt'].includes(entry.name.toLowerCase())
    ))
    .map((entry) => entry.name)
    .sort(lexicalCompare);
  if (!imageNames.some((name) => name.toLowerCase() === 'magick.exe')) {
    fail(`Required ImageMagick executable is missing from ${imageRoot}`);
  }
  const imageCopied = ['magick.exe', ...imageNames.filter((name) => name.toLowerCase() !== 'magick.exe')];
  for (const name of imageCopied) {
    await addExplicitTool(entries, path.join(imageRoot, name), `tools/imagemagick/${name}`, imageRoot);
  }
  records.push({
    tool: 'imagemagick',
    sourceWorkspaceRelativeDirectory: `work/wo000-tools/${path.basename(imageRoot)}`,
    copiedFiles: imageCopied,
  });
  return records;
}

async function verifyNoQaImports(projectRoot) {
  const projectManifest = JSON.parse(await readFile(path.join(projectRoot, 'project.json'), 'utf8'));
  const references = JSON.stringify({
    plugins: projectManifest.plugins,
    assetLibraries: projectManifest.assetLibraries,
    sharedLibraries: projectManifest.sharedLibraries,
  });
  if (/owner-pilot-qa-20261002|ai-test-/i.test(references)) {
    fail('Canonical website project.json contains a QA project/library/plugin reference.');
  }
  const searchableExtensions = new Set(['.json', '.html', '.js', '.mjs', '.css', '.md', '.txt', '.xml']);
  async function scan(directory, relative = '') {
    const children = await readdir(directory, { withFileTypes: true });
    children.sort((a, b) => lexicalCompare(a.name, b.name));
    for (const child of children) {
      const childRelative = relative ? `${relative}/${child.name}` : child.name;
      const absolute = path.join(directory, child.name);
      if (child.isDirectory()) {
        if (isProjectExcluded(childRelative)) continue;
        await scan(absolute, childRelative);
      } else if (child.isFile() && searchableExtensions.has(path.extname(child.name).toLowerCase())) {
        const content = await readFile(absolute, 'utf8');
        if (/owner-pilot-qa-20261002|ai-test-/i.test(content)) {
          fail(`Canonical website project contains a QA project import/reference: ${childRelative}`);
        }
      }
    }
  }
  await scan(projectRoot);
}

async function verifyOwnerStaticExportProfile(packageRoot) {
  const exportManager = path.join(packageRoot, 'packages', 'export-manager', 'src', 'index.ts');
  if (!(await stat(exportManager)).isFile()) fail('Studio export-manager source is absent from the package.');
  const adapter = await readFile(exportManager, 'utf8');
  const profilePath = path.join(packageRoot, 'packages', 'export-manager', 'src', 'base-path.mjs');
  const ownerUiPath = path.join(packageRoot, 'apps', 'studio', 'public', 'owner-export-profile.js');
  const studioUiPath = path.join(packageRoot, 'apps', 'studio', 'public', 'studio.js');
  const [profile, ownerUi, studioUi] = await Promise.all([
    readFile(profilePath, 'utf8'), readFile(ownerUiPath, 'utf8'), readFile(studioUiPath, 'utf8'),
  ]);
  if (!adapter.includes('staticExportProfile(b.collections.publishing') || !profile.includes('publishing.staticExport')) {
    fail('The owner publishing.staticExport profile is not wired through the packaged export manager.');
  }
  if (!/\bbasePath\b/.test(profile) || !/\bstaging\b/i.test(profile) ||
      !/Export base path/.test(studioUi) || !/Staging export/.test(studioUi) || !ownerUi.includes('normalizeBasePath')) {
    fail('Packaged owner Site Settings UI does not expose and validate both basePath and staging settings.');
  }
  const publishingPath = path.join(packageRoot, 'projects', 'toadal-feast-owner-authoring', 'collections', 'publishing.json');
  const publishing = JSON.parse(await readFile(publishingPath, 'utf8'));
  if (publishing.staticExport?.schemaVersion !== 1 || publishing.staticExport?.basePath !== '/toadal-feast-web/' || publishing.staticExport?.staging !== true) {
    fail('The packaged owner website project does not carry the qualified GitHub Pages staging profile.');
  }
  return {
    id: 'publishing.staticExport',
    sourceFiles: [
      'packages/export-manager/src/index.ts',
      'packages/export-manager/src/base-path.mjs',
      'apps/studio/public/studio.js',
      'apps/studio/public/owner-export-profile.js',
    ],
    configFieldsRequired: ['basePath', 'staging'],
    purpose: 'Owner UI creates a Pages-compatible ZIP using the configured Site Settings values without an external CLI.',
  };
}

async function verifyPublicGameBytes(websiteRoot, packageRoot, websitePaths) {
  const prefix = 'studio-project/toadal-feast-website/reference/public/games/';
  const sourceFiles = websitePaths.filter((item) => item.startsWith(prefix) && !isProjectExcluded(item));
  if (sourceFiles.length === 0) fail('The canonical website source has no reference/public/games payload.');
  for (const sourceRelative of sourceFiles) {
    const source = path.join(websiteRoot, ...sourceRelative.split('/'));
    const packageRelative = `projects/toadal-feast-owner-authoring/${sourceRelative.slice('studio-project/toadal-feast-website/'.length)}`;
    const packaged = path.join(packageRoot, ...packageRelative.split('/'));
    const [sourceHash, packageHash] = await Promise.all([hashFile(source), hashFile(packaged)]);
    if (sourceHash.sha256 !== packageHash.sha256 || sourceHash.bytes !== packageHash.bytes) {
      fail(`Reference game bytes changed while packaging: ${sourceRelative}`);
    }
  }
}

async function createLedger(packageRoot) {
  const files = [];
  async function visit(directory, prefix = '') {
    const children = await readdir(directory, { withFileTypes: true });
    children.sort((a, b) => lexicalCompare(a.name, b.name));
    for (const child of children) {
      const relative = prefix ? `${prefix}/${child.name}` : child.name;
      const absolute = path.join(directory, child.name);
      if (child.isDirectory()) await visit(absolute, relative);
      else if (child.isFile() && relative !== LEDGER_NAME) {
        const digest = await hashFile(absolute);
        files.push({ path: relative, bytes: digest.bytes, sha256: digest.sha256 });
      }
    }
  }
  await visit(packageRoot);
  files.sort((a, b) => lexicalCompare(a.path, b.path));
  const ledger = {
    schemaVersion: 1,
    algorithm: 'SHA-256',
    selfExclusion: {
      path: LEDGER_NAME,
      rule: 'The ledger does not hash itself; every other regular payload file is listed.',
    },
    files,
  };
  await writeFile(path.join(packageRoot, LEDGER_NAME), `${JSON.stringify(ledger, null, 2)}\n`, { flag: 'wx' });
  return files;
}

function packageReadme(metadata) {
  return `# TOADAL Studio owner-authoring package\n\n` +
    `Package label: \`${metadata.packageLabel}\` (derived package label; Studio remains version 1.4.2).\n\n` +
    `This package contains the Studio source snapshot, its already installed dependencies, the canonical TOADAL FEAST owner-authoring website project, and the recorded offline utilities. It does not build or deploy the public website. The reference distribution and public game files are carried as source bytes.\n\n` +
    `## Open the local owner Studio\n\n` +
    `1. Extract the complete ZIP to a writable folder.\n` +
    `2. Install or provide Node.js 22 or newer on PATH. No npm install or network access is needed when the bundled dependencies are present.\n` +
    `3. Run \`RUN_OWNER_WEBSITE.bat\`. It calls \`LAUNCH_OWNER_WEBSITE.ps1\`, uses the exact project at \`projects/toadal-feast-owner-authoring/project.json\`, and checks the local server on port 4324.\n` +
    `4. Run \`STOP_OWNER_WEBSITE.bat\` to stop the recorded Studio process. Its helper checks the PID and exact packaged server path before stopping it.\n\n` +
    `The owner publishing profile \`publishing.staticExport\` creates a Pages-compatible ZIP from the configured Site Settings \`basePath\` and \`staging\` values; it does not require an external CLI.\n\n` +
    `\`RUN_SERVER_AUDIT.bat\` is included unchanged as the server audit entry point.\n\n` +
    `## Source provenance\n\n` +
    `Studio HEAD/tree: \`${metadata.sources.studio.head}\` / \`${metadata.sources.studio.tree}\`\n\n` +
    `Website HEAD/tree: \`${metadata.sources.website.head}\` / \`${metadata.sources.website.tree}\`\n\n` +
    `The source worktree status digests and the hash ledger bind this package to the selected worktree files. See \`PACKAGE_METADATA.json\` and \`${LEDGER_NAME}\`.\n`;
}

function assertSeparated(sourceRoots, outputPath) {
  for (const root of sourceRoots) {
    if (insideRoot(root, outputPath) || insideRoot(outputPath, root)) {
      fail(`Output and source paths must not overlap: ${outputPath} ; ${root}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const [label, root] of [['Studio', args.studio], ['website', args.website], ['tools', args.tools]]) {
    if (!(await stat(root)).isDirectory()) fail(`${label} root is not a directory: ${root}`);
  }
  const scratch = path.resolve(args.scratch);
  const sourceRoots = await Promise.all([args.studio, args.website, args.tools].map((root) => realpath(root)));
  assertSeparated(sourceRoots, scratch);
  try {
    await lstat(scratch);
    fail(`Refusing to overwrite the requested output directory: ${scratch}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const studioSource = await captureRepo(args.studio, 'studio', args.studioHead, args.studioTree);
  const websiteSource = await captureRepo(args.website, 'website', args.websiteHead, args.websiteTree);
  const dependencyTree = await verifyInstalledDependencyTree(args.studio);
  const studioPaths = gitPaths(args.studio);
  const websitePaths = gitPaths(args.website);
  const entries = new Map();
  const studioRoot = await realpath(args.studio);
  const websiteRoot = await realpath(args.website);
  const toolsRoot = await realpath(args.tools);

  await addGitSelectedFiles(
    entries,
    studioRoot,
    studioPaths,
    (item) => !item.split('/').some((part) => part.toLowerCase() === 'node_modules'),
    (item) => item,
    isStudioExcluded,
  );
  // studio-data is intentionally Git-ignored; preserve the user's original
  // vault and authored data by explicitly adding this complete data tree.
  const studioData = path.join(studioRoot, 'studio-data');
  await addTree(entries, studioRoot, studioData, 'studio-data', (item) => !isTransient(item) && !item.toLowerCase().startsWith('studio-data/owner-launch/'));

  const nodeModules = path.join(studioRoot, 'node_modules');
  if (!(await stat(nodeModules)).isDirectory()) fail(`Pinned Studio node_modules are missing: ${nodeModules}`);
  if (!(await stat(path.join(studioRoot, 'package-lock.json'))).isFile()) fail('Studio package-lock.json is missing.');
  await addTree(entries, studioRoot, nodeModules, 'node_modules', (item) => !isTransient(item));

  const projectPrefix = 'studio-project/toadal-feast-website/';
  await addGitSelectedFiles(
    entries,
    websiteRoot,
    websitePaths,
    (item) => item.startsWith(projectPrefix),
    (item) => `projects/toadal-feast-owner-authoring/${item.slice(projectPrefix.length)}`,
    isProjectExcluded,
  );
  await addGitSelectedFiles(
    entries,
    websiteRoot,
    websitePaths,
    (item) => item.startsWith('docs/authoring/'),
    (item) => `website-docs/authoring/${item.slice('docs/authoring/'.length)}`,
    (item) => isProjectExcluded(item) || item.toLowerCase().includes('/pre-object-owner-gate/') || item.toLowerCase().endsWith('/qa_runner_investigation.md') || !(/\.md$/i.test(item) || /\/evidence\//i.test(item)),
  );
  const tools = await selectToolFiles(entries, toolsRoot);

  for (const required of REQUIRED_LAUNCHERS) {
    if (!entries.has(required.toLowerCase())) fail(`The Git-selected Studio snapshot is missing required launcher: ${required}`);
  }
  const projectManifestEntry = entries.get('projects/toadal-feast-owner-authoring/project.json');
  if (!projectManifestEntry) fail('The canonical website project.json is absent from the Git-selected website files.');

  const parent = path.dirname(scratch);
  await mkdir(parent, { recursive: true });
  const staging = await mkdtemp(path.join(parent, `${path.basename(scratch)}.building-${process.pid}-${randomUUID()}-`));
  const packageRoot = path.join(staging, PACKAGE_FOLDER);
  await mkdir(packageRoot, { recursive: true });
  const copied = await copyEntries(entries, packageRoot);
  await verifyCopiedEntries(entries, packageRoot);

  await verifyNoQaImports(packageRoot);
  await verifyPublicGameBytes(websiteRoot, packageRoot, websitePaths);
  const ownerStaticExportProfile = await verifyOwnerStaticExportProfile(packageRoot);

  const launchers = [];
  for (const name of REQUIRED_LAUNCHERS) {
    const source = path.join(studioRoot, name);
    const packaged = path.join(packageRoot, name);
    const [sourceHash, packageHash] = await Promise.all([hashFile(source), hashFile(packaged)]);
    if (sourceHash.sha256 !== packageHash.sha256 || sourceHash.bytes !== packageHash.bytes) {
      fail(`Launcher was not copied byte-for-byte: ${name}`);
    }
    launchers.push({ path: name, bytes: sourceHash.bytes, sha256: sourceHash.sha256, copiedFromGitSelectedStudioWorktree: true });
  }

  const lockHash = await hashFile(path.join(packageRoot, 'package-lock.json'));
  const metadata = {
    schemaVersion: 1,
    packageLabel: PACKAGE_LABEL,
    studioBaseVersion: '1.4.2',
    derivedLabelNotice: 'This is a derived owner-authoring package label, not an official Studio version release.',
    sources: { studio: studioSource, website: websiteSource },
    websiteProject: {
      sourcePath: 'studio-project/toadal-feast-website',
      packagePath: 'projects/toadal-feast-owner-authoring',
      publicGamesByteVerified: true,
      qaProjectImportsFound: false,
    },
    ownerStaticExportProfile,
    dependencies: {
      source: 'Studio working-tree node_modules; copied as installed, without npm ci or network access.',
      packageLockSha256: lockHash.sha256,
      includedFileCount: copied.filter((item) => item.packagePath.startsWith('node_modules/')).length,
      validation: dependencyTree,
    },
    launchers,
    tools: tools.map((tool) => ({
      ...tool,
      licenseAndSourceMetadataFiles: tool.copiedFiles.filter((name) => /license|notice|readme|where|contents|\.txt$|\.ann$/i.test(name)),
      licensingStatement: 'Only the listed adjacent files were copied; no additional license conclusion is asserted by this metadata.',
    })),
    fileTimestampNormalization: 'All staged regular files use 2020-01-01T00:00:00.000Z before ZIP creation.',
    archiveOrdering: 'SHA-256 ledger path order (UTF-8 byte lexical) is supplied explicitly to Info-ZIP through stdin.',
    ledger: { path: LEDGER_NAME, selfExclusionRule: 'The ledger hashes every regular payload file except itself.' },
  };
  await writeFile(path.join(packageRoot, 'PACKAGE_METADATA.json'), `${JSON.stringify(metadata, null, 2)}\n`, { flag: 'wx' });
  await writeFile(path.join(packageRoot, 'OWNER_AUTHORING_PACKAGE_README.md'), packageReadme(metadata), { flag: 'wx' });
  const payloadFiles = await createLedger(packageRoot);

  const finalStudioSource = await captureRepo(args.studio, 'Studio', args.studioHead, args.studioTree);
  const finalWebsiteSource = await captureRepo(args.website, 'website', args.websiteHead, args.websiteTree);
  if (finalStudioSource.worktreeStatusSha256 !== studioSource.worktreeStatusSha256 || finalWebsiteSource.worktreeStatusSha256 !== websiteSource.worktreeStatusSha256) {
    fail('A source worktree changed while the package was being assembled.');
  }

  const archiveName = `${PACKAGE_FOLDER}.zip`;
  const archivePath = path.join(staging, archiveName);
  const zipExe = path.join(toolsRoot, 'zip', 'zip.exe');
  const unzipExe = path.join(toolsRoot, 'unzip', 'unzip.exe');
  const list = [...payloadFiles.map((item) => `${PACKAGE_FOLDER}/${item.path}`), `${PACKAGE_FOLDER}/${LEDGER_NAME}`]
    .sort(lexicalCompare);
  if (list.some((item) => /[\r\n\u0000]/.test(item))) fail('ZIP entry contains a line break or NUL and cannot be listed safely.');
  run(zipExe, ['-X', '-9', '-UN=UTF8', archivePath, '-@'], {
    cwd: staging,
    input: `${list.join('\n')}\n`,
    maxBuffer: 16 * 1024 * 1024,
  });
  run(unzipExe, ['-tqq', archivePath], { cwd: staging, maxBuffer: 16 * 1024 * 1024 });
  const archiveListing = run(unzipExe, ['-Z1', archivePath], { cwd: staging, maxBuffer: 16 * 1024 * 1024 })
    .stdout.trimEnd().split(/\r?\n/).filter(Boolean);
  if (archiveListing.length !== list.length || archiveListing.some((item, index) => item !== list[index])) {
    fail('ZIP contents differ from the sorted SHA-256 payload ledger.');
  }

  const archiveDigest = await hashFile(archivePath);
  await chmod(archivePath, 0o444);
  await writeFile(path.join(staging, `${archiveName}.sha256`), `${archiveDigest.sha256}  ${archiveName}\n`, { flag: 'wx' });
  await rename(staging, scratch);

  process.stdout.write(`${JSON.stringify({
    packageDirectory: path.join(scratch, PACKAGE_FOLDER),
    zip: path.join(scratch, archiveName),
    zipSha256: archiveDigest.sha256,
    zipBytes: archiveDigest.bytes,
    hashedPayloadFileCount: payloadFiles.length,
    archiveEntryCount: list.length,
    outputDirectory: scratch,
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`Owner Studio package assembly failed: ${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
