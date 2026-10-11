const HOME_GAMES_ID = 'component.home.games';
const WORLD_DISCOVERY_ID = 'component.world.map-discovery';
const WORLD_GRID_ID = 'component.world.map-discovery.bdd73088f428.discovery-scene-grid';
const WORLD_ART_HREF = '/media/#world-art';
const OBJECT_LINK_CLASS = 'owner-object-link';

const childrenOf = component => component?.props?.children;

function findById(components, id) {
  for (const component of components ?? []) {
    if (component?.id === id) return component;
    const found = findById(childrenOf(component), id);
    if (found) return found;
  }
  return null;
}

function transformById(components, id, transform) {
  let changed = false;
  const next = components.map(component => {
    if (component?.id === id) {
      changed = true;
      return transform(component);
    }
    const children = childrenOf(component);
    if (!Array.isArray(children)) return component;
    const nextChildren = transformById(children, id, transform);
    if (nextChildren === children) return component;
    changed = true;
    return { ...component, props: { ...component.props, children: nextChildren } };
  });
  return changed ? next : components;
}

function requiredPage(page, pageId) {
  if (!page || !Array.isArray(page.components)) throw new TypeError(`Expected a page with components for ${pageId}`);
}

function recordsById(games) {
  const values = Array.isArray(games) ? games : games?.games;
  if (!Array.isArray(values)) throw new TypeError('Expected game records as an array');
  const result = new Map();
  for (const game of values) {
    if (!game || typeof game.id !== 'string' || result.has(game.id)) throw new Error('Game records contain a missing or duplicate ID');
    result.set(game.id, game);
  }
  return result;
}

function assetIds(assets) {
  const values = Array.isArray(assets) ? assets : assets?.assets;
  if (!Array.isArray(values)) throw new TypeError('Expected the asset catalog or an asset array');
  return new Set(values.map(asset => typeof asset === 'string' ? asset : asset?.id).filter(Boolean));
}

function addClass(className, extra) {
  const classes = String(className ?? '').split(/\s+/).filter(Boolean);
  if (!classes.includes(extra)) classes.push(extra);
  return classes.join(' ');
}

function nativeText(id, tag, text, layerName, className = '') {
  return {
    id,
    type: 'core.text',
    props: {
      authoringVersion: 1,
      tag,
      className,
      attributes: {},
      style: '',
      layerName,
      text,
    },
  };
}

function validateGameForCard(card, game, knownAssets) {
  if (!game) throw new Error(`Unknown game for Home card ${card.id}: ${card.props?.gameId}`);
  const expectedId = `component.home.game.${game.slug}`;
  if (!game.slug || card.id !== expectedId || card.props?.gameId !== game.id) {
    throw new Error(`Home game card/game mismatch: ${card.id} is bound to ${card.props?.gameId}, expected ${expectedId} for ${game.id}`);
  }
  if (typeof game.name !== 'string' || !game.name.trim()) throw new Error(`Game ${game.id} has no display name`);
  if (typeof game.route !== 'string' || !/^\/(?!\/)[^\s\\]*$/.test(game.route) || /[\u0000-\u001f]/.test(game.route)
    || game.route !== `/games/${game.slug}/`) {
    throw new Error(`Game ${game.id} has an invalid or mismatched internal route: ${game.route}`);
  }
  if (typeof game.artAsset !== 'string' || !knownAssets.has(game.artAsset)) {
    throw new Error(`Unknown art asset for ${game.id}: ${game.artAsset}`);
  }
  if (typeof (game.web?.shortDescription || game.summary) !== 'string') {
    throw new Error(`Game ${game.id} has no short description or summary`);
  }
  if (typeof game.status !== 'string' || !/^[a-z][a-z0-9-]*$/.test(game.status)) throw new Error(`Game ${game.id} has an invalid status`);
  if (typeof game.statusLabel !== 'string' || !game.statusLabel) throw new Error(`Game ${game.id} has no status label`);
}

function makeNativeGameCard(card, game) {
  const props = card.props;
  const description = game.web?.shortDescription || game.summary;
  return {
    ...card,
    type: 'layout.container',
    props: {
      ...props,
      authoringVersion: 1,
      tag: 'a',
      className: addClass('module studio-game-card', OBJECT_LINK_CLASS),
      attributes: { 'aria-label': `View ${game.name} details` },
      style: '',
      layerName: game.name,
      href: game.route,
      mode: 'inherit',
      children: [
        {
          id: `${card.id}.art`,
          type: 'core.image',
          props: {
            authoringVersion: 1,
            tag: 'img',
            className: '',
            attributes: { loading: 'lazy', decoding: 'async' },
            style: '',
            layerName: `${game.name} artwork`,
            asset: game.artAsset,
            alt: `${game.name} artwork`,
          },
        },
        nativeText(`${card.id}.heading`, 'h3', game.name, game.name),
        nativeText(`${card.id}.description`, 'p', description, `${game.name} description`),
        nativeText(`${card.id}.status`, 'span', game.statusLabel, `${game.name} status`, `chip ${game.status}`),
      ],
    },
  };
}

/** Return a copied Home page whose four registered game cards are native v1 links. */
export function closeHomeGameCards(page, games, assets) {
  requiredPage(page, 'Home');
  const originalRoot = findById(page.components, HOME_GAMES_ID);
  if (!originalRoot || originalRoot.type !== 'layout.grid' || !Array.isArray(childrenOf(originalRoot))) {
    throw new Error(`Could not find ${HOME_GAMES_ID} as a populated layout.grid`);
  }
  const sourceCards = childrenOf(originalRoot);
  // Approved native preview cards keep the toggle independent from navigation.
  // A playable card may also have a direct player link, separately registered.
  const nativeCard = card => card?.props?.authoringVersion === 1 &&
    (card.props.tag === 'a' || card.props.tag === 'article' && card.props.attributes?.['data-game-preview'] === 'v1');
  if(sourceCards.length===4&&sourceCards.every(nativeCard)){
    const byGame=recordsById(games),knownAssets=assetIds(assets);
    const descendants = node => [node, ...(childrenOf(node) || []).flatMap(descendants)];
    for(const card of sourceCards) {
      const game = byGame.get(card.props.gameId);
      validateGameForCard(card, game, knownAssets);
      if (card.props.tag === 'article') {
        const nodes = descendants(card), links = nodes.filter(node => node.props?.tag === 'a');
        const has = (node, key) => Object.hasOwn(node.props.attributes || {}, key);
        const details = links.filter(node => node.props.href === game.route &&
          (has(node, 'data-game-preview-link') || has(node, 'data-game-preview-details')));
        const expectedPlayerRoute = `/player/${game.slug}/`;
        const launches = links.filter(node => node.props.href === expectedPlayerRoute && has(node, 'data-game-preview-link'));
        if (details.length !== 1 || launches.length > 1 || details.length + launches.length !== links.length) {
          throw new Error(`Native preview card ${card.id} must retain one registered details link and only registered player links`);
        }
        for (const link of [...details, ...launches]) {
          if (descendants(link).slice(1).some(node => ['a','button','input'].includes(node.props?.tag))) {
            throw new Error(`Native preview card ${card.id} contains nested interactive controls`);
          }
        }
        const images = nodes.filter(node => node.type === 'core.image');
        if (!images.length || images.some(node => !knownAssets.has(node.props.asset))) {
          throw new Error(`Unknown art asset in native preview card ${card.id}`);
        }
      }
    }
    if(new Set(sourceCards.map(card=>card.props.gameId)).size!==4)throw new Error('Home game cards must resolve to four distinct registered games');
    return structuredClone(page);
  }
  if (sourceCards.length !== 4 || sourceCards.some(card => card?.type !== 'game.card')) {
    throw new Error(`${HOME_GAMES_ID} must contain exactly four legacy game.card children`);
  }

  const byGame = recordsById(games);
  const knownAssets = assetIds(assets);
  if (byGame.size !== 4) throw new Error(`Expected exactly four registered Home games, found ${byGame.size}`);
  const resolved = sourceCards.map(card => {
    const game = byGame.get(card.props?.gameId);
    validateGameForCard(card, game, knownAssets);
    return [card, game];
  });
  if (new Set(resolved.map(([, game]) => game.id)).size !== 4) throw new Error('Home game cards do not resolve to four distinct registered games');

  const copied = structuredClone(page);
  const components = transformById(copied.components, HOME_GAMES_ID, root => ({
    ...root,
    props: {
      ...root.props,
      children: resolved.map(([card, game]) => makeNativeGameCard(card, game)),
    },
  }));
  return { ...copied, components };
}

function collectAnchors(component, result = []) {
  if (component?.props?.tag === 'a' || component?.type === 'core.button' && component?.props?.href) result.push(component);
  for (const child of childrenOf(component) ?? []) collectAnchors(child, result);
  return result;
}

function convertSecondaryAnchor(component) {
  const props = { ...component.props, tag: 'span' };
  delete props.href;
  delete props.target;
  delete props.label;
  if (component.props.label !== undefined && component.props.text === undefined && !Array.isArray(component.props.children)) {
    props.text = component.props.label;
  }
  return { ...component, type: 'core.text', props };
}

function mapWorldCard(card) {
  const props = card.props;
  let conversions = 0;
  const rewrite = component => {
    if (component !== card && component?.type === 'core.button' && component.props?.href === WORLD_ART_HREF) {
      conversions++;
      return convertSecondaryAnchor(component);
    }
    const children = childrenOf(component);
    if (!Array.isArray(children)) return component;
    const nextChildren = children.map(rewrite);
    return nextChildren.some((child, index) => child !== children[index])
      ? { ...component, props: { ...component.props, children: nextChildren } }
      : component;
  };
  const allLinks = collectAnchors(card);
  if (allLinks.length !== 1 || allLinks[0].props?.href !== WORLD_ART_HREF) {
    throw new Error(`World preview card ${card.id} must contain exactly one ${WORLD_ART_HREF} link and no other links`);
  }
  if(card.props.tag==='a'&&card.props.href===WORLD_ART_HREF)return structuredClone(card);
  const next = rewrite(card);
  if (conversions !== 1) throw new Error(`World preview card ${card.id} has an unsupported secondary link structure`);
  const nextProps = {
    ...next.props,
    tag: 'a',
    className: addClass(next.props.className, OBJECT_LINK_CLASS),
    attributes: { ...next.props.attributes },
    href: WORLD_ART_HREF,
  };
  if (nextProps.attributes.role === 'listitem') delete nextProps.attributes.role;
  return { ...next, props: nextProps };
}

/** Return a copied World page with only the three linked environment preview cards made whole-card links. */
export function closeWorldDiscoveryCards(page) {
  requiredPage(page, 'World');
  const root = findById(page.components, WORLD_DISCOVERY_ID);
  const grid = findById(page.components, WORLD_GRID_ID);
  if (!root || !grid || !Array.isArray(childrenOf(grid))) throw new Error('Could not find the authored World discovery collection');
  const cards = childrenOf(grid);
  if (cards.length !== 5) throw new Error(`World discovery collection must retain exactly five cards, found ${cards.length}`);
  const linkedCards = cards.filter(card => collectAnchors(card).some(link => link.props?.href === WORLD_ART_HREF));
  if (linkedCards.length !== 3) throw new Error(`Expected exactly three linked World environment preview cards, found ${linkedCards.length}`);
  for (const card of linkedCards) mapWorldCard(card);

  const copied = structuredClone(page);
  let components = transformById(copied.components, WORLD_GRID_ID, collection => ({
    ...collection,
    props: {
      ...collection.props,
      attributes: { ...collection.props.attributes, role: 'group' },
      children: childrenOf(collection).map(card => linkedCards.some(linked => linked.id === card.id) ? mapWorldCard(card) : card),
    },
  }));
  return { ...copied, components };
}

/** Apply both bounded pure transformations and return only the two changed page copies. */
export function closeOwnerNativeObjectPages({ home, world, games, assets }) {
  return {
    home: closeHomeGameCards(home, games, assets),
    world: closeWorldDiscoveryCards(world),
  };
}
