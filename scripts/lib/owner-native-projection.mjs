import fs from 'node:fs';
import crypto from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildReviewedOwnerRenderer } from './owner-renderer-build.mjs';

const vendorDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'vendor');
const rendererPath = path.join(vendorDir, 'owner-authoring-renderer.mjs');
const provenancePath = path.join(vendorDir, 'owner-authoring-renderer.provenance.json');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

/** Check the pinned SDK and, when supplied, its exact Studio source and build. */
export function verifyOwnerRendererProvenance(studioRoot) {
  const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
  const generated = fs.readFileSync(rendererPath);
  if (sha256(generated) !== provenance.generatedSha256) {
    throw new Error('Vendored owner renderer differs from its provenance SHA-256 pin; regenerate the SDK from the reviewed Studio source and update provenance pins');
  }
  if (!studioRoot) return { valid: true, sourceChecked: false, provenance };

  const root = path.resolve(studioRoot);
  const sourcePath = path.join(root, provenance.source);
  const packagePath = path.join(root, 'package.json');
  if (!fs.existsSync(sourcePath) || !fs.existsSync(packagePath)) {
    throw new Error(`Studio owner renderer source or package metadata not found under ${root}`);
  }
  const source = fs.readFileSync(sourcePath);
  const studioVersion = JSON.parse(fs.readFileSync(packagePath, 'utf8')).version;
  if (studioVersion !== provenance.studioVersion) {
    throw new Error(`Studio version drift: expected ${provenance.studioVersion}, found ${studioVersion}; review and regenerate the vendored SDK, then update provenance pins`);
  }
  if (sha256(source) !== provenance.sourceSha256) {
    throw new Error(`Studio owner renderer source drift at ${sourcePath}; review and regenerate scripts/vendor/owner-authoring-renderer.mjs, then update provenance pins`);
  }
  const build = buildReviewedOwnerRenderer(root);
  if (JSON.stringify(build.dependencies) !== JSON.stringify(provenance.dependencies)) {
    throw new Error('Studio owner renderer dependency source drift; review and regenerate the pinned SDK');
  }
  const generatedFromSource = build.generated;
  if (!generated.equals(Buffer.from(generatedFromSource))) {
    throw new Error('Vendored owner renderer diverges from the pinned Studio source after TypeScript stripping; regenerate the SDK and update provenance pins');
  }
  return { valid: true, sourceChecked: true, provenance };
}

const stripLegacyRichTextSafety = value => String(value ?? '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/\son\w+\s*=\s*(["']).*?\1/gi, '')
  .replace(/javascript:/gi, '');
const escapeStudioAttribute = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function renderStudioRichText(component) {
  const props = component.props || {};
  if (props.hidden) return '';
  if (props.runtimeOnly) return stripLegacyRichTextSafety(props.html || '');
  const anchorId = String(props.anchorId || '').trim().replace(/[^A-Za-z0-9_.:-]+/g, '-').replace(/^-+|-+$/g, '');
  const id = escapeStudioAttribute(component.id);
  const animation = String(props.animation || 'none').replace(/^animation\./, '');
  const attributes = [
    anchorId ? `id="${escapeStudioAttribute(anchorId)}"` : '',
    `data-studio-component="${id}"`,
    props.locked ? 'data-studio-locked="true"' : '',
    animation !== 'none' ? `data-studio-animation="${escapeStudioAttribute(animation)}"` : '',
    props.variant ? `data-studio-variant="${escapeStudioAttribute(String(props.variant))}"` : '',
    props.visibility ? `data-studio-visibility="${escapeStudioAttribute(JSON.stringify(props.visibility))}"` : '',
    props.bindings ? `data-studio-bindings="${escapeStudioAttribute(JSON.stringify(props.bindings))}"` : '',
    props.reveal ? `data-studio-reveal="${escapeStudioAttribute(String(props.revealPreset || 'slide-up'))}"` : '',
  ].filter(Boolean).join(' ');
  const body = stripLegacyRichTextSafety(props.html || '<p>Write something…</p>');
  return `<section class="studio-rich-text shell section" ${attributes}>${body}</section>`;
}

function resolveProjectRoot(projectRoot) {
  const candidate = path.resolve(projectRoot);
  if (fs.existsSync(path.join(candidate, 'project.json'))) return candidate;
  const nested = path.join(candidate, 'studio-project', 'toadal-feast-website');
  if (fs.existsSync(path.join(nested, 'project.json'))) return nested;
  throw new Error(`Could not find Studio project.json under ${candidate}`);
}

function loadProjectData(projectRoot) {
  const root = resolveProjectRoot(projectRoot);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'project.json'), 'utf8'));
  const pageIndex = JSON.parse(fs.readFileSync(path.join(root, manifest.pageIndex || 'pages/index.json'), 'utf8'));
  const assetCatalog = JSON.parse(fs.readFileSync(path.join(root, manifest.assetCatalog || 'assets/index.json'), 'utf8'));
  const pages = new Map((pageIndex.pages || []).map(record => [record.id, record]));
  const animations = manifest.animations ? JSON.parse(fs.readFileSync(path.join(root, manifest.animations), 'utf8')).animations || [] : [];
  return { root, manifest, pages, assets: assetCatalog.assets || [], animations };
}

function getPage(project, pageOrID) {
  if (pageOrID && typeof pageOrID === 'object') return pageOrID;
  const record = project.pages.get(pageOrID);
  if (!record) throw new Error(`Unknown Studio page: ${pageOrID}`);
  const filename = path.resolve(project.root, record.file);
  const pageRoot = path.resolve(project.root, 'pages') + path.sep;
  if (!filename.startsWith(pageRoot)) throw new Error(`Page file escapes the project pages directory: ${record.file}`);
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function createAssetUrl(project) {
  return id => {
    const asset = project.assets.find(candidate => candidate.id === id);
    if (!asset) return null;
    const referenceRoot = path.resolve(project.root, project.manifest.referenceDist || 'reference');
    const source = path.resolve(project.root, asset.source);
    if (source.startsWith(referenceRoot + path.sep)
      && asset.source === asset.referenceSource
      && asset.sha256 === asset.referenceSha256) {
      return `/${path.relative(referenceRoot, source).replaceAll('\\', '/')}`;
    }
    return `/assets/studio/${id.replace(/[^a-z0-9_-]+/gi, '-')}.${String(asset.sha256 || '').slice(0, 10)}.${asset.extension}`;
  };
}

function createProjector({ renderOwnerComponent, renderLegacyComponent }) {
  if (typeof renderOwnerComponent !== 'function') throw new TypeError('renderOwnerComponent must be a function');

  function projectComponent(project, component) {
    if (!component || typeof component !== 'object') throw new TypeError('Page components must be objects');
    if (component.props?.authoringVersion) {
      return renderOwnerComponent(component, createAssetUrl(project), child => projectComponent(project, child), id => project.animations.find(animation => String(animation.id).replace(/^animation\./, '') === id)?.reducedMotionFallback || 'none');
    }
    if (typeof renderLegacyComponent === 'function') {
      const rendered = renderLegacyComponent(component, { assetUrl: createAssetUrl(project), renderChild: child => projectComponent(project, child) });
      if (rendered !== undefined) {
        if (typeof rendered !== 'string') throw new TypeError(`Legacy renderer must return a string for ${component.id || 'unnamed component'}`);
        return rendered;
      }
    }
    if (component.type === 'core.rich-text') return renderStudioRichText(component);
    if (typeof component.props?.html === 'string') return stripLegacyRichTextSafety(component.props.html);
    throw new Error(`Legacy component ${component.id || '(unnamed)'} requires renderLegacyComponent; no HTML blob is available`);
  }

  function projectAvailableEvidence(project, component) {
    if (component?.props?.authoringVersion || typeof component?.props?.html === 'string' || typeof renderLegacyComponent === 'function') {
      return projectComponent(project, component);
    }
    const children = component?.props?.children || component?.children;
    if (!Array.isArray(children)) return '';
    return children.map(child => projectAvailableEvidence(project, child)).join('');
  }

  const project = (projectRoot, pageOrID) => {
    const project = loadProjectData(projectRoot);
    const page = getPage(project, pageOrID);
    return (page.components || []).map(component => projectComponent(project, component)).join('');
  };

  project.projectComponentHtml = (projectRoot, component) => {
    const project = loadProjectData(projectRoot);
    return projectAvailableEvidence(project, component);
  };
  project.projectPageComponents = (projectRoot, pageOrID) => {
    const project = loadProjectData(projectRoot);
    const page = getPage(project, pageOrID);
    return (page.components || []).map(component => ({ component, html: projectAvailableEvidence(project, component) }));
  };
  return project;
}

/** Load the audited Studio owner renderer once and return a synchronous projector. */
export async function createOwnerNativeProjector(studioRoot = process.env.TOADAL_STUDIO_ROOT, runtime = {}) {
  const injected = runtime.renderOwnerComponent;
  if (injected) return createProjector({ renderOwnerComponent: injected, renderLegacyComponent: runtime.renderLegacyComponent });
  verifyOwnerRendererProvenance(studioRoot);
  // The exact reviewed source/dependency closure was verified above. Load the
  // self-contained pinned build, so relative imports never escape a data URL.
  const ownerModule = await import(pathToFileURL(rendererPath).href);
  return createProjector({
    renderOwnerComponent: ownerModule.renderOwnerComponent,
    renderLegacyComponent: runtime.renderLegacyComponent,
  });
}

/** Project the component HTML for a page ID or page record. */
export async function projectPageHtml(projectRoot, pageOrID, studioRoot = process.env.TOADAL_STUDIO_ROOT, runtime = {}) {
  const project = await createOwnerNativeProjector(studioRoot, runtime);
  return project(projectRoot, pageOrID);
}
