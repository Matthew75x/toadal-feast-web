# Astra review request — Studio visual builder implementation manifest

Date: 2026-10-03

Review `STUDIO_VISUAL_BUILDER_IMPLEMENTATION_MANIFEST_V1_20261003.md` as an implementation architecture, not as a brainstorming prompt.

The owner wants Codex to execute after this review with minimal architectural discretion.

## Required response

For each item A1–A24 return: ACCEPT / AMEND / REJECT / SOURCE-DEPENDENT. For any amendment, state the exact replacement contract, migration consequence, test needed, and which implementation gate changes.

A1. Preserve the existing project graph and deterministic renderer as the single persisted source of truth.  
A2. Use compatibility/capability adapters over the hybrid legacy/native component model; no mass rewrite.  
A3. Authoring identity = page/node/instance-path/slot-path/part/repeat-key/render-epoch.  
A4. Semantic CommandGateway is the only mutation path; raw patch/diff is internal only.  
A5. Begin with one active draft session to prevent canvas/Inspector/text conflicts.  
A6. Rich-text local history is session-scoped; Apply becomes one outer Studio history command.  
A7. Responsive design = intrinsic sizing/layout first, sparse Base/Tablet/Mobile exceptions second.  
A8. Proposed responsive precedence resolves breakpoint chain inside each source layer, then source-layer precedence; explicit instance ownership therefore outranks shared-definition values. Review carefully.  
A9. Legacy image fields keep their current semantics and renderer contract during the first direct-manipulation tranche.  
A10. New image-v2, when needed, separates frame geometry / bitmap presentation / semantic content and declares an algorithm version.  
A11. Retain the real browser iframe preview and use a hybrid in-frame geometry overlay + host Inspector; exact trust/origin mode is source-dependent.  
A12. Native Pointer Events is the manipulation baseline; Moveable/Cropper are adapter candidates selected only after the prescribed spike.  
A13. Normal drag is structural; arbitrary x/y movement exists only in an explicit bounded Freeform container.  
A14. Pattern is independent; Shared Symbol is linked; Detach is explicit.  
A15. Cross-project reuse carries a dependency closure and conflict policy.  
A16. Central behavior rule records are authoritative, with contextual component references.  
A17. Behavior v1 remains small and typed; no arbitrary expression/JavaScript language.  
A18. Interactive speech bubbles are not modeled as tooltips; meaningful messages do not default to five-second disappearance.  
A19. Declarative Project Packs precede executable plugins.  
A20. Packs/plugins use exact version/digest locks; SemVer only after public compatibility contracts are explicit.  
A21. Adapter-first migration; no silent migration on open; pre-migration snapshot/old build is rollback.  
A22. Imported project/pack archives are untrusted input and receive path/size/compression/content validation before switching active project.  
A23. Every drag has non-drag pointer and keyboard alternatives; 320 CSS-pixel reflow/focus/reduced-motion are qualification gates.  
A24. Unchanged-core Starship Engineer clean-room authoring is mandatory before calling Studio a generic builder.

## Questions Astra should specifically challenge

1. Is A8 the least surprising linked-instance responsive precedence, or should a different policy be adopted?
2. Is any proposed abstraction premature for the current owner need?
3. What edge case is most likely to falsify the AuthoringAddress?
4. Should the initial media slice write legacy image fields exclusively until G2, or introduce the v2 projection during GS?
5. Is the preview/overlay split correct once current iframe/source constraints are known?
6. Is the centralized behavior record model preferable to component-local rules for duplication/portability?
7. Are Pattern / Shared Symbol / Detach semantics sufficient for the owner's “reuse previous functionality” goal?
8. Is the pack lock/dependency contract enough to prove Starship portability without executable plugins?
9. Which test or failure injection is missing from G0–G7?
10. Does any recommendation risk unnecessary schema migration or accepted TOADAL output drift?

Do not recommend a platform replacement merely because another builder offers a similar feature. Any replacement proposal must show why the current project/renderer cannot support the owner workflow and include a lossless migration/recovery proof.
