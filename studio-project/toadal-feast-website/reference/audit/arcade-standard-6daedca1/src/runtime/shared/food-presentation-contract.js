// ============================================================
// src/runtime/shared/food-presentation-contract.js — Cross-mode food render geometry
// ============================================================
// Approved canonical food masters are sized by visible alpha bounds, not raw
// PNG canvas dimensions. This keeps a tall kiwi, wide burger, and compact
// cherry cluster visually coherent without modifying their source files.

const FoodPresentationContract = (() => {
  'use strict';

  const FALLBACK_VISIBLE_BOUNDS = Object.freeze({ x: 0, y: 0, width: 1, height: 1 });

  function finitePositive(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function profileKey(mode, surface) { return `${String(mode || '')}.${String(surface || '')}`; }

  function resolveRecord(request = {}, includeInactive = false) {
    if (typeof FoodPresentationRegistry === 'undefined' || !FoodPresentationRegistry?.get) return null;
    const foodId = String(request.foodId || request.canonicalFoodId || '');
    const record = FoodPresentationRegistry.get(foodId);
    if (!record || (!includeInactive && !record.runtimeActive)) return null;
    const key = String(request.profileKey || FoodPresentationRegistry.profileKeyFor?.(request.mode, request.surface) || profileKey(request.mode, request.surface));
    const profile = FoodPresentationRegistry.profile?.(key);
    if (!profile) return null;
    return { record, profile, profileKey: key };
  }


  function presentationRecordForProfile(record, profileKeyValue) {
    return record?.profileBounds?.[profileKeyValue] || record;
  }

  function normalizedBounds(record) {
    const bounds = record?.visibleBounds || FALLBACK_VISIBLE_BOUNDS;
    const x = Math.max(0, Math.min(1, Number(bounds.x)));
    const y = Math.max(0, Math.min(1, Number(bounds.y)));
    const width = Math.max(0.0001, Math.min(1 - x, Number(bounds.width)));
    const height = Math.max(0.0001, Math.min(1 - y, Number(bounds.height)));
    return { x, y, width, height };
  }

  function resolveGeometryInternal(image, request = {}, includeInactive = false) {
    const sourceWidth = finitePositive(image?.naturalWidth || image?.width);
    const sourceHeight = finitePositive(image?.naturalHeight || image?.height);
    const surfaceWidth = finitePositive(request.surfaceWidth || request.width || request.size);
    const surfaceHeight = finitePositive(request.surfaceHeight || request.height || request.size);
    const x = Number(request.x);
    const y = Number(request.y);
    if (!sourceWidth || !sourceHeight || !surfaceWidth || !surfaceHeight || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    const resolved = resolveRecord(request, includeInactive);
    if (!resolved) return null;

    const presentationRecord = presentationRecordForProfile(resolved.record, resolved.profileKey);
    const bounds = normalizedBounds(presentationRecord);
    const overrideWeight = finitePositive(resolved.record?.override?.visualWeight) || 1;
    const requestedScale = finitePositive(request.presentationScale) || 1;
    const margin = Number(resolved.profile.minimumSafeMarginFraction);
    const baseFootprint = Number(resolved.profile.targetVisibleFraction);
    const safeFraction = Math.max(0.0001, 1 - 2 * margin);
    const footprint = Math.min(safeFraction, baseFootprint * overrideWeight * requestedScale);
    const targetVisibleWidth = surfaceWidth * footprint;
    const targetVisibleHeight = surfaceHeight * footprint;

    const scale = Math.min(
      targetVisibleWidth / (bounds.width * sourceWidth),
      targetVisibleHeight / (bounds.height * sourceHeight),
    );
    if (!Number.isFinite(scale) || scale <= 0) return null;

    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const visibleCenterX = (bounds.x + bounds.width / 2) * sourceWidth * scale;
    const visibleCenterY = (bounds.y + bounds.height / 2) * sourceHeight * scale;
    const drawX = x - visibleCenterX;
    const drawY = y - visibleCenterY;
    const visibleRect = {
      x: drawX + bounds.x * sourceWidth * scale,
      y: drawY + bounds.y * sourceHeight * scale,
      width: bounds.width * sourceWidth * scale,
      height: bounds.height * sourceHeight * scale,
    };
    const safeRect = {
      x: x - surfaceWidth / 2 + surfaceWidth * margin,
      y: y - surfaceHeight / 2 + surfaceHeight * margin,
      width: surfaceWidth * safeFraction,
      height: surfaceHeight * safeFraction,
    };
    const epsilon = 0.001;
    const withinSafeFrame = visibleRect.x >= safeRect.x - epsilon
      && visibleRect.y >= safeRect.y - epsilon
      && visibleRect.x + visibleRect.width <= safeRect.x + safeRect.width + epsilon
      && visibleRect.y + visibleRect.height <= safeRect.y + safeRect.height + epsilon;
    if (!withinSafeFrame) return null;

    return Object.freeze({
      canonicalFoodId: resolved.record.canonicalFoodId,
      profileKey: resolved.profileKey,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
      visibleRect: Object.freeze(visibleRect),
      safeRect: Object.freeze(safeRect),
      visibleBounds: Object.freeze(bounds),
      presentationSourcePath: presentationRecord?.sourcePath || resolved.record?.sourcePath || null,
      sourceWidth,
      sourceHeight,
      surfaceWidth,
      surfaceHeight,
      footprint,
      withinSafeFrame,
    });
  }

  function resolveGeometry(image, request = {}) { return resolveGeometryInternal(image, request, false); }
  function resolvePreviewGeometry(image, request = {}) { return resolveGeometryInternal(image, request, true); }

  function draw(ctx, image, request = {}) {
    if (!ctx?.drawImage) return false;
    const geometry = resolveGeometry(image, request);
    if (!geometry) return false;
    ctx.drawImage(image, geometry.drawX, geometry.drawY, geometry.drawWidth, geometry.drawHeight);
    return true;
  }

  function hasApprovedPresentation(request = {}) { return Boolean(resolveRecord(request)); }

  return Object.freeze({ resolveGeometry, resolvePreviewGeometry, draw, hasApprovedPresentation, profileKey });
})();

if (typeof globalThis !== 'undefined') globalThis.FoodPresentationContract = FoodPresentationContract;
