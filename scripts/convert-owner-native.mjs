import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
// Snapshot of the owner renderer's tag contract, not a new Studio schema.
// Callers can supply ownerTags derived from the actual validateOwnerProps export.
export const OWNER_TAGS = new Set('section article div nav aside header footer main p h1 h2 h3 h4 h5 h6 span strong em b i small a button img input label select option textarea form fieldset legend ul ol li dl dt dd figure figcaption blockquote cite time details summary br hr table thead tbody tr th td video source picture audio svg path circle rect line polyline polygon g title #text'.split(' '));
const SEMANTIC_TAGS = new Set([...OWNER_TAGS, ...'caption progress code mark del sub sup u wbr abbr address pre s col colgroup tfoot optgroup output meter datalist'.split(' ')]);
const RUNTIME_TAGS = new Set('iframe script noscript object embed canvas foreignobject use image animate animatetransform set'.split(' '));
const RAW_TAGS = new Set(['script', 'style', 'iframe', 'textarea']);
const STRUCTURAL_TAGS = new Set('form fieldset select datalist input source picture table thead tbody tfoot tr colgroup col svg path circle rect line polyline polygon g'.split(' '));
const freezePolicy = (policy) => Object.freeze({ ...policy, codeResources: Object.freeze(policy.codeResources.map((resource) => Object.freeze({ ...resource }))) });
export const RUNTIME_EXCEPTIONS = Object.freeze([
  Object.freeze({ route: '/', componentId: 'component.home.interactive-discovery', kind: 'external-script', maxBytes: 2048, policy: freezePolicy({
    id: 'site-global-home-discovery-loader-v1', mode: 'global-loader',
    codeResources: [
      { url: '/assets/js/home-interactive-discovery.js', source: 'assets/js/home-interactive-discovery.js', sha256: '6ad7d11a5a2f64c8c36023b4dba2c8d08551854971c01d7fa614ce61d053ad49' },
      { url: '/assets/js/guest-progression.js', source: 'assets/js/guest-progression.js', sha256: '5e795b22398fed42de68bacc6448c5813610f605bb6745d0163c1961f6840338' },
      { url: '/assets/js/manifest-shell.js', source: 'assets/js/manifest-shell.js', sha256: '43726f9cf37f0a4beaff81c969d3c304c9f54bec07af9bae88bfbc30b6df7f8c' },
      { url: '/assets/js/play-catalogue.js', source: 'assets/js/play-catalogue.js', sha256: '347c0ee01761571ca583cb199d9ba989f169a7ff97fdaea874374c4054b92c39' },
    ],
  }) }),
  Object.freeze({ route: '/player/wicked-bites/', componentId: 'component.muogc5wx.80e0fg', kind: 'isolated-frame', maxBytes: 2048, policy: freezePolicy({
    id: 'isolated-wicked-bites-frame-v1', mode: 'sandboxed-iframe', sandbox: 'allow-scripts allow-pointer-lock', allow: 'fullscreen',
    codeResources: [{ url: '/public/games/wicked-bites/index.html', source: 'public/games/wicked-bites/index.html', sha256: '783dfe877c931a6d142a1453eaddace6776d4852d4dae074a20b40975b47036c' }],
  }) }),
  Object.freeze({ route: '/reader/', componentId: 'component.comic.reader-preview', kind: 'dynamic-image', maxBytes: 2048, policy: freezePolicy({
    id: 'stories-publishing-dynamic-image-v1', mode: 'dynamic-image-slot', selector: '[data-reader-page]', sourceMustBeAbsent: true,
    codeResources: [
      { url: '/assets/js/stories-publishing.js', source: 'assets/js/stories-publishing.js', sha256: 'b8f1b2b960fdaafc4b29cb4919693e66dfe92f88dda9cc5fe33b8923579733f3' },
      { url: '/assets/js/manifest-shell.js', source: 'assets/js/manifest-shell.js', sha256: '43726f9cf37f0a4beaff81c969d3c304c9f54bec07af9bae88bfbc30b6df7f8c' },
    ],
  }) }),
]);
const BOOLEAN_ATTRIBUTES = new Set('allowfullscreen async autofocus autoplay checked controls default defer disabled formnovalidate hidden inert ismap loop multiple muted nomodule novalidate open playsinline readonly required reversed selected'.split(' '));
// Standard HTML named references (Python stdlib html.entities.html5 snapshot); no runtime dependency.
const HTML_ENTITIES = Object.freeze({"Aacute":"Á","aacute":"á","Abreve":"Ă","abreve":"ă","ac":"∾","acd":"∿","acE":"∾̳","Acirc":"Â","acirc":"â","acute":"´","Acy":"А","acy":"а","AElig":"Æ","aelig":"æ","af":"⁡","Afr":"𝔄","afr":"𝔞","Agrave":"À","agrave":"à","alefsym":"ℵ","aleph":"ℵ","Alpha":"Α","alpha":"α","Amacr":"Ā","amacr":"ā","amalg":"⨿","AMP":"&","amp":"&","And":"⩓","and":"∧","andand":"⩕","andd":"⩜","andslope":"⩘","andv":"⩚","ang":"∠","ange":"⦤","angle":"∠","angmsd":"∡","angmsdaa":"⦨","angmsdab":"⦩","angmsdac":"⦪","angmsdad":"⦫","angmsdae":"⦬","angmsdaf":"⦭","angmsdag":"⦮","angmsdah":"⦯","angrt":"∟","angrtvb":"⊾","angrtvbd":"⦝","angsph":"∢","angst":"Å","angzarr":"⍼","Aogon":"Ą","aogon":"ą","Aopf":"𝔸","aopf":"𝕒","ap":"≈","apacir":"⩯","apE":"⩰","ape":"≊","apid":"≋","apos":"'","ApplyFunction":"⁡","approx":"≈","approxeq":"≊","Aring":"Å","aring":"å","Ascr":"𝒜","ascr":"𝒶","Assign":"≔","ast":"*","asymp":"≈","asympeq":"≍","Atilde":"Ã","atilde":"ã","Auml":"Ä","auml":"ä","awconint":"∳","awint":"⨑","backcong":"≌","backepsilon":"϶","backprime":"‵","backsim":"∽","backsimeq":"⋍","Backslash":"∖","Barv":"⫧","barvee":"⊽","Barwed":"⌆","barwed":"⌅","barwedge":"⌅","bbrk":"⎵","bbrktbrk":"⎶","bcong":"≌","Bcy":"Б","bcy":"б","bdquo":"„","becaus":"∵","Because":"∵","because":"∵","bemptyv":"⦰","bepsi":"϶","bernou":"ℬ","Bernoullis":"ℬ","Beta":"Β","beta":"β","beth":"ℶ","between":"≬","Bfr":"𝔅","bfr":"𝔟","bigcap":"⋂","bigcirc":"◯","bigcup":"⋃","bigodot":"⨀","bigoplus":"⨁","bigotimes":"⨂","bigsqcup":"⨆","bigstar":"★","bigtriangledown":"▽","bigtriangleup":"△","biguplus":"⨄","bigvee":"⋁","bigwedge":"⋀","bkarow":"⤍","blacklozenge":"⧫","blacksquare":"▪","blacktriangle":"▴","blacktriangledown":"▾","blacktriangleleft":"◂","blacktriangleright":"▸","blank":"␣","blk12":"▒","blk14":"░","blk34":"▓","block":"█","bne":"=⃥","bnequiv":"≡⃥","bNot":"⫭","bnot":"⌐","Bopf":"𝔹","bopf":"𝕓","bot":"⊥","bottom":"⊥","bowtie":"⋈","boxbox":"⧉","boxDL":"╗","boxDl":"╖","boxdL":"╕","boxdl":"┐","boxDR":"╔","boxDr":"╓","boxdR":"╒","boxdr":"┌","boxH":"═","boxh":"─","boxHD":"╦","boxHd":"╤","boxhD":"╥","boxhd":"┬","boxHU":"╩","boxHu":"╧","boxhU":"╨","boxhu":"┴","boxminus":"⊟","boxplus":"⊞","boxtimes":"⊠","boxUL":"╝","boxUl":"╜","boxuL":"╛","boxul":"┘","boxUR":"╚","boxUr":"╙","boxuR":"╘","boxur":"└","boxV":"║","boxv":"│","boxVH":"╬","boxVh":"╫","boxvH":"╪","boxvh":"┼","boxVL":"╣","boxVl":"╢","boxvL":"╡","boxvl":"┤","boxVR":"╠","boxVr":"╟","boxvR":"╞","boxvr":"├","bprime":"‵","Breve":"˘","breve":"˘","brvbar":"¦","Bscr":"ℬ","bscr":"𝒷","bsemi":"⁏","bsim":"∽","bsime":"⋍","bsol":"\\","bsolb":"⧅","bsolhsub":"⟈","bull":"•","bullet":"•","bump":"≎","bumpE":"⪮","bumpe":"≏","Bumpeq":"≎","bumpeq":"≏","Cacute":"Ć","cacute":"ć","Cap":"⋒","cap":"∩","capand":"⩄","capbrcup":"⩉","capcap":"⩋","capcup":"⩇","capdot":"⩀","CapitalDifferentialD":"ⅅ","caps":"∩︀","caret":"⁁","caron":"ˇ","Cayleys":"ℭ","ccaps":"⩍","Ccaron":"Č","ccaron":"č","Ccedil":"Ç","ccedil":"ç","Ccirc":"Ĉ","ccirc":"ĉ","Cconint":"∰","ccups":"⩌","ccupssm":"⩐","Cdot":"Ċ","cdot":"ċ","cedil":"¸","Cedilla":"¸","cemptyv":"⦲","cent":"¢","CenterDot":"·","centerdot":"·","Cfr":"ℭ","cfr":"𝔠","CHcy":"Ч","chcy":"ч","check":"✓","checkmark":"✓","Chi":"Χ","chi":"χ","cir":"○","circ":"ˆ","circeq":"≗","circlearrowleft":"↺","circlearrowright":"↻","circledast":"⊛","circledcirc":"⊚","circleddash":"⊝","CircleDot":"⊙","circledR":"®","circledS":"Ⓢ","CircleMinus":"⊖","CirclePlus":"⊕","CircleTimes":"⊗","cirE":"⧃","cire":"≗","cirfnint":"⨐","cirmid":"⫯","cirscir":"⧂","ClockwiseContourIntegral":"∲","CloseCurlyDoubleQuote":"”","CloseCurlyQuote":"’","clubs":"♣","clubsuit":"♣","Colon":"∷","colon":":","Colone":"⩴","colone":"≔","coloneq":"≔","comma":",","commat":"@","comp":"∁","compfn":"∘","complement":"∁","complexes":"ℂ","cong":"≅","congdot":"⩭","Congruent":"≡","Conint":"∯","conint":"∮","ContourIntegral":"∮","Copf":"ℂ","copf":"𝕔","coprod":"∐","Coproduct":"∐","COPY":"©","copy":"©","copysr":"℗","CounterClockwiseContourIntegral":"∳","crarr":"↵","Cross":"⨯","cross":"✗","Cscr":"𝒞","cscr":"𝒸","csub":"⫏","csube":"⫑","csup":"⫐","csupe":"⫒","ctdot":"⋯","cudarrl":"⤸","cudarrr":"⤵","cuepr":"⋞","cuesc":"⋟","cularr":"↶","cularrp":"⤽","Cup":"⋓","cup":"∪","cupbrcap":"⩈","CupCap":"≍","cupcap":"⩆","cupcup":"⩊","cupdot":"⊍","cupor":"⩅","cups":"∪︀","curarr":"↷","curarrm":"⤼","curlyeqprec":"⋞","curlyeqsucc":"⋟","curlyvee":"⋎","curlywedge":"⋏","curren":"¤","curvearrowleft":"↶","curvearrowright":"↷","cuvee":"⋎","cuwed":"⋏","cwconint":"∲","cwint":"∱","cylcty":"⌭","Dagger":"‡","dagger":"†","daleth":"ℸ","Darr":"↡","dArr":"⇓","darr":"↓","dash":"‐","Dashv":"⫤","dashv":"⊣","dbkarow":"⤏","dblac":"˝","Dcaron":"Ď","dcaron":"ď","Dcy":"Д","dcy":"д","DD":"ⅅ","dd":"ⅆ","ddagger":"‡","ddarr":"⇊","DDotrahd":"⤑","ddotseq":"⩷","deg":"°","Del":"∇","Delta":"Δ","delta":"δ","demptyv":"⦱","dfisht":"⥿","Dfr":"𝔇","dfr":"𝔡","dHar":"⥥","dharl":"⇃","dharr":"⇂","DiacriticalAcute":"´","DiacriticalDot":"˙","DiacriticalDoubleAcute":"˝","DiacriticalGrave":"`","DiacriticalTilde":"˜","diam":"⋄","Diamond":"⋄","diamond":"⋄","diamondsuit":"♦","diams":"♦","die":"¨","DifferentialD":"ⅆ","digamma":"ϝ","disin":"⋲","div":"÷","divide":"÷","divideontimes":"⋇","divonx":"⋇","DJcy":"Ђ","djcy":"ђ","dlcorn":"⌞","dlcrop":"⌍","dollar":"$","Dopf":"𝔻","dopf":"𝕕","Dot":"¨","dot":"˙","DotDot":"⃜","doteq":"≐","doteqdot":"≑","DotEqual":"≐","dotminus":"∸","dotplus":"∔","dotsquare":"⊡","doublebarwedge":"⌆","DoubleContourIntegral":"∯","DoubleDot":"¨","DoubleDownArrow":"⇓","DoubleLeftArrow":"⇐","DoubleLeftRightArrow":"⇔","DoubleLeftTee":"⫤","DoubleLongLeftArrow":"⟸","DoubleLongLeftRightArrow":"⟺","DoubleLongRightArrow":"⟹","DoubleRightArrow":"⇒","DoubleRightTee":"⊨","DoubleUpArrow":"⇑","DoubleUpDownArrow":"⇕","DoubleVerticalBar":"∥","DownArrow":"↓","Downarrow":"⇓","downarrow":"↓","DownArrowBar":"⤓","DownArrowUpArrow":"⇵","DownBreve":"̑","downdownarrows":"⇊","downharpoonleft":"⇃","downharpoonright":"⇂","DownLeftRightVector":"⥐","DownLeftTeeVector":"⥞","DownLeftVector":"↽","DownLeftVectorBar":"⥖","DownRightTeeVector":"⥟","DownRightVector":"⇁","DownRightVectorBar":"⥗","DownTee":"⊤","DownTeeArrow":"↧","drbkarow":"⤐","drcorn":"⌟","drcrop":"⌌","Dscr":"𝒟","dscr":"𝒹","DScy":"Ѕ","dscy":"ѕ","dsol":"⧶","Dstrok":"Đ","dstrok":"đ","dtdot":"⋱","dtri":"▿","dtrif":"▾","duarr":"⇵","duhar":"⥯","dwangle":"⦦","DZcy":"Џ","dzcy":"џ","dzigrarr":"⟿","Eacute":"É","eacute":"é","easter":"⩮","Ecaron":"Ě","ecaron":"ě","ecir":"≖","Ecirc":"Ê","ecirc":"ê","ecolon":"≕","Ecy":"Э","ecy":"э","eDDot":"⩷","Edot":"Ė","eDot":"≑","edot":"ė","ee":"ⅇ","efDot":"≒","Efr":"𝔈","efr":"𝔢","eg":"⪚","Egrave":"È","egrave":"è","egs":"⪖","egsdot":"⪘","el":"⪙","Element":"∈","elinters":"⏧","ell":"ℓ","els":"⪕","elsdot":"⪗","Emacr":"Ē","emacr":"ē","empty":"∅","emptyset":"∅","EmptySmallSquare":"◻","emptyv":"∅","EmptyVerySmallSquare":"▫","emsp13":" ","emsp14":" ","emsp":" ","ENG":"Ŋ","eng":"ŋ","ensp":" ","Eogon":"Ę","eogon":"ę","Eopf":"𝔼","eopf":"𝕖","epar":"⋕","eparsl":"⧣","eplus":"⩱","epsi":"ε","Epsilon":"Ε","epsilon":"ε","epsiv":"ϵ","eqcirc":"≖","eqcolon":"≕","eqsim":"≂","eqslantgtr":"⪖","eqslantless":"⪕","Equal":"⩵","equals":"=","EqualTilde":"≂","equest":"≟","Equilibrium":"⇌","equiv":"≡","equivDD":"⩸","eqvparsl":"⧥","erarr":"⥱","erDot":"≓","Escr":"ℰ","escr":"ℯ","esdot":"≐","Esim":"⩳","esim":"≂","Eta":"Η","eta":"η","ETH":"Ð","eth":"ð","Euml":"Ë","euml":"ë","euro":"€","excl":"!","exist":"∃","Exists":"∃","expectation":"ℰ","ExponentialE":"ⅇ","exponentiale":"ⅇ","fallingdotseq":"≒","Fcy":"Ф","fcy":"ф","female":"♀","ffilig":"ﬃ","fflig":"ﬀ","ffllig":"ﬄ","Ffr":"𝔉","ffr":"𝔣","filig":"ﬁ","FilledSmallSquare":"◼","FilledVerySmallSquare":"▪","fjlig":"fj","flat":"♭","fllig":"ﬂ","fltns":"▱","fnof":"ƒ","Fopf":"𝔽","fopf":"𝕗","ForAll":"∀","forall":"∀","fork":"⋔","forkv":"⫙","Fouriertrf":"ℱ","fpartint":"⨍","frac12":"½","frac13":"⅓","frac14":"¼","frac15":"⅕","frac16":"⅙","frac18":"⅛","frac23":"⅔","frac25":"⅖","frac34":"¾","frac35":"⅗","frac38":"⅜","frac45":"⅘","frac56":"⅚","frac58":"⅝","frac78":"⅞","frasl":"⁄","frown":"⌢","Fscr":"ℱ","fscr":"𝒻","gacute":"ǵ","Gamma":"Γ","gamma":"γ","Gammad":"Ϝ","gammad":"ϝ","gap":"⪆","Gbreve":"Ğ","gbreve":"ğ","Gcedil":"Ģ","Gcirc":"Ĝ","gcirc":"ĝ","Gcy":"Г","gcy":"г","Gdot":"Ġ","gdot":"ġ","gE":"≧","ge":"≥","gEl":"⪌","gel":"⋛","geq":"≥","geqq":"≧","geqslant":"⩾","ges":"⩾","gescc":"⪩","gesdot":"⪀","gesdoto":"⪂","gesdotol":"⪄","gesl":"⋛︀","gesles":"⪔","Gfr":"𝔊","gfr":"𝔤","Gg":"⋙","gg":"≫","ggg":"⋙","gimel":"ℷ","GJcy":"Ѓ","gjcy":"ѓ","gl":"≷","gla":"⪥","glE":"⪒","glj":"⪤","gnap":"⪊","gnapprox":"⪊","gnE":"≩","gne":"⪈","gneq":"⪈","gneqq":"≩","gnsim":"⋧","Gopf":"𝔾","gopf":"𝕘","grave":"`","GreaterEqual":"≥","GreaterEqualLess":"⋛","GreaterFullEqual":"≧","GreaterGreater":"⪢","GreaterLess":"≷","GreaterSlantEqual":"⩾","GreaterTilde":"≳","Gscr":"𝒢","gscr":"ℊ","gsim":"≳","gsime":"⪎","gsiml":"⪐","GT":">","Gt":"≫","gt":">","gtcc":"⪧","gtcir":"⩺","gtdot":"⋗","gtlPar":"⦕","gtquest":"⩼","gtrapprox":"⪆","gtrarr":"⥸","gtrdot":"⋗","gtreqless":"⋛","gtreqqless":"⪌","gtrless":"≷","gtrsim":"≳","gvertneqq":"≩︀","gvnE":"≩︀","Hacek":"ˇ","hairsp":" ","half":"½","hamilt":"ℋ","HARDcy":"Ъ","hardcy":"ъ","hArr":"⇔","harr":"↔","harrcir":"⥈","harrw":"↭","Hat":"^","hbar":"ℏ","Hcirc":"Ĥ","hcirc":"ĥ","hearts":"♥","heartsuit":"♥","hellip":"…","hercon":"⊹","Hfr":"ℌ","hfr":"𝔥","HilbertSpace":"ℋ","hksearow":"⤥","hkswarow":"⤦","hoarr":"⇿","homtht":"∻","hookleftarrow":"↩","hookrightarrow":"↪","Hopf":"ℍ","hopf":"𝕙","horbar":"―","HorizontalLine":"─","Hscr":"ℋ","hscr":"𝒽","hslash":"ℏ","Hstrok":"Ħ","hstrok":"ħ","HumpDownHump":"≎","HumpEqual":"≏","hybull":"⁃","hyphen":"‐","Iacute":"Í","iacute":"í","ic":"⁣","Icirc":"Î","icirc":"î","Icy":"И","icy":"и","Idot":"İ","IEcy":"Е","iecy":"е","iexcl":"¡","iff":"⇔","Ifr":"ℑ","ifr":"𝔦","Igrave":"Ì","igrave":"ì","ii":"ⅈ","iiiint":"⨌","iiint":"∭","iinfin":"⧜","iiota":"℩","IJlig":"Ĳ","ijlig":"ĳ","Im":"ℑ","Imacr":"Ī","imacr":"ī","image":"ℑ","ImaginaryI":"ⅈ","imagline":"ℐ","imagpart":"ℑ","imath":"ı","imof":"⊷","imped":"Ƶ","Implies":"⇒","in":"∈","incare":"℅","infin":"∞","infintie":"⧝","inodot":"ı","Int":"∬","int":"∫","intcal":"⊺","integers":"ℤ","Integral":"∫","intercal":"⊺","Intersection":"⋂","intlarhk":"⨗","intprod":"⨼","InvisibleComma":"⁣","InvisibleTimes":"⁢","IOcy":"Ё","iocy":"ё","Iogon":"Į","iogon":"į","Iopf":"𝕀","iopf":"𝕚","Iota":"Ι","iota":"ι","iprod":"⨼","iquest":"¿","Iscr":"ℐ","iscr":"𝒾","isin":"∈","isindot":"⋵","isinE":"⋹","isins":"⋴","isinsv":"⋳","isinv":"∈","it":"⁢","Itilde":"Ĩ","itilde":"ĩ","Iukcy":"І","iukcy":"і","Iuml":"Ï","iuml":"ï","Jcirc":"Ĵ","jcirc":"ĵ","Jcy":"Й","jcy":"й","Jfr":"𝔍","jfr":"𝔧","jmath":"ȷ","Jopf":"𝕁","jopf":"𝕛","Jscr":"𝒥","jscr":"𝒿","Jsercy":"Ј","jsercy":"ј","Jukcy":"Є","jukcy":"є","Kappa":"Κ","kappa":"κ","kappav":"ϰ","Kcedil":"Ķ","kcedil":"ķ","Kcy":"К","kcy":"к","Kfr":"𝔎","kfr":"𝔨","kgreen":"ĸ","KHcy":"Х","khcy":"х","KJcy":"Ќ","kjcy":"ќ","Kopf":"𝕂","kopf":"𝕜","Kscr":"𝒦","kscr":"𝓀","lAarr":"⇚","Lacute":"Ĺ","lacute":"ĺ","laemptyv":"⦴","lagran":"ℒ","Lambda":"Λ","lambda":"λ","Lang":"⟪","lang":"⟨","langd":"⦑","langle":"⟨","lap":"⪅","Laplacetrf":"ℒ","laquo":"«","Larr":"↞","lArr":"⇐","larr":"←","larrb":"⇤","larrbfs":"⤟","larrfs":"⤝","larrhk":"↩","larrlp":"↫","larrpl":"⤹","larrsim":"⥳","larrtl":"↢","lat":"⪫","lAtail":"⤛","latail":"⤙","late":"⪭","lates":"⪭︀","lBarr":"⤎","lbarr":"⤌","lbbrk":"❲","lbrace":"{","lbrack":"[","lbrke":"⦋","lbrksld":"⦏","lbrkslu":"⦍","Lcaron":"Ľ","lcaron":"ľ","Lcedil":"Ļ","lcedil":"ļ","lceil":"⌈","lcub":"{","Lcy":"Л","lcy":"л","ldca":"⤶","ldquo":"“","ldquor":"„","ldrdhar":"⥧","ldrushar":"⥋","ldsh":"↲","lE":"≦","le":"≤","LeftAngleBracket":"⟨","LeftArrow":"←","Leftarrow":"⇐","leftarrow":"←","LeftArrowBar":"⇤","LeftArrowRightArrow":"⇆","leftarrowtail":"↢","LeftCeiling":"⌈","LeftDoubleBracket":"⟦","LeftDownTeeVector":"⥡","LeftDownVector":"⇃","LeftDownVectorBar":"⥙","LeftFloor":"⌊","leftharpoondown":"↽","leftharpoonup":"↼","leftleftarrows":"⇇","LeftRightArrow":"↔","Leftrightarrow":"⇔","leftrightarrow":"↔","leftrightarrows":"⇆","leftrightharpoons":"⇋","leftrightsquigarrow":"↭","LeftRightVector":"⥎","LeftTee":"⊣","LeftTeeArrow":"↤","LeftTeeVector":"⥚","leftthreetimes":"⋋","LeftTriangle":"⊲","LeftTriangleBar":"⧏","LeftTriangleEqual":"⊴","LeftUpDownVector":"⥑","LeftUpTeeVector":"⥠","LeftUpVector":"↿","LeftUpVectorBar":"⥘","LeftVector":"↼","LeftVectorBar":"⥒","lEg":"⪋","leg":"⋚","leq":"≤","leqq":"≦","leqslant":"⩽","les":"⩽","lescc":"⪨","lesdot":"⩿","lesdoto":"⪁","lesdotor":"⪃","lesg":"⋚︀","lesges":"⪓","lessapprox":"⪅","lessdot":"⋖","lesseqgtr":"⋚","lesseqqgtr":"⪋","LessEqualGreater":"⋚","LessFullEqual":"≦","LessGreater":"≶","lessgtr":"≶","LessLess":"⪡","lesssim":"≲","LessSlantEqual":"⩽","LessTilde":"≲","lfisht":"⥼","lfloor":"⌊","Lfr":"𝔏","lfr":"𝔩","lg":"≶","lgE":"⪑","lHar":"⥢","lhard":"↽","lharu":"↼","lharul":"⥪","lhblk":"▄","LJcy":"Љ","ljcy":"љ","Ll":"⋘","ll":"≪","llarr":"⇇","llcorner":"⌞","Lleftarrow":"⇚","llhard":"⥫","lltri":"◺","Lmidot":"Ŀ","lmidot":"ŀ","lmoust":"⎰","lmoustache":"⎰","lnap":"⪉","lnapprox":"⪉","lnE":"≨","lne":"⪇","lneq":"⪇","lneqq":"≨","lnsim":"⋦","loang":"⟬","loarr":"⇽","lobrk":"⟦","LongLeftArrow":"⟵","Longleftarrow":"⟸","longleftarrow":"⟵","LongLeftRightArrow":"⟷","Longleftrightarrow":"⟺","longleftrightarrow":"⟷","longmapsto":"⟼","LongRightArrow":"⟶","Longrightarrow":"⟹","longrightarrow":"⟶","looparrowleft":"↫","looparrowright":"↬","lopar":"⦅","Lopf":"𝕃","lopf":"𝕝","loplus":"⨭","lotimes":"⨴","lowast":"∗","lowbar":"_","LowerLeftArrow":"↙","LowerRightArrow":"↘","loz":"◊","lozenge":"◊","lozf":"⧫","lpar":"(","lparlt":"⦓","lrarr":"⇆","lrcorner":"⌟","lrhar":"⇋","lrhard":"⥭","lrm":"‎","lrtri":"⊿","lsaquo":"‹","Lscr":"ℒ","lscr":"𝓁","Lsh":"↰","lsh":"↰","lsim":"≲","lsime":"⪍","lsimg":"⪏","lsqb":"[","lsquo":"‘","lsquor":"‚","Lstrok":"Ł","lstrok":"ł","LT":"<","Lt":"≪","lt":"<","ltcc":"⪦","ltcir":"⩹","ltdot":"⋖","lthree":"⋋","ltimes":"⋉","ltlarr":"⥶","ltquest":"⩻","ltri":"◃","ltrie":"⊴","ltrif":"◂","ltrPar":"⦖","lurdshar":"⥊","luruhar":"⥦","lvertneqq":"≨︀","lvnE":"≨︀","macr":"¯","male":"♂","malt":"✠","maltese":"✠","Map":"⤅","map":"↦","mapsto":"↦","mapstodown":"↧","mapstoleft":"↤","mapstoup":"↥","marker":"▮","mcomma":"⨩","Mcy":"М","mcy":"м","mdash":"—","mDDot":"∺","measuredangle":"∡","MediumSpace":" ","Mellintrf":"ℳ","Mfr":"𝔐","mfr":"𝔪","mho":"℧","micro":"µ","mid":"∣","midast":"*","midcir":"⫰","middot":"·","minus":"−","minusb":"⊟","minusd":"∸","minusdu":"⨪","MinusPlus":"∓","mlcp":"⫛","mldr":"…","mnplus":"∓","models":"⊧","Mopf":"𝕄","mopf":"𝕞","mp":"∓","Mscr":"ℳ","mscr":"𝓂","mstpos":"∾","Mu":"Μ","mu":"μ","multimap":"⊸","mumap":"⊸","nabla":"∇","Nacute":"Ń","nacute":"ń","nang":"∠⃒","nap":"≉","napE":"⩰̸","napid":"≋̸","napos":"ŉ","napprox":"≉","natur":"♮","natural":"♮","naturals":"ℕ","nbsp":" ","nbump":"≎̸","nbumpe":"≏̸","ncap":"⩃","Ncaron":"Ň","ncaron":"ň","Ncedil":"Ņ","ncedil":"ņ","ncong":"≇","ncongdot":"⩭̸","ncup":"⩂","Ncy":"Н","ncy":"н","ndash":"–","ne":"≠","nearhk":"⤤","neArr":"⇗","nearr":"↗","nearrow":"↗","nedot":"≐̸","NegativeMediumSpace":"​","NegativeThickSpace":"​","NegativeThinSpace":"​","NegativeVeryThinSpace":"​","nequiv":"≢","nesear":"⤨","nesim":"≂̸","NestedGreaterGreater":"≫","NestedLessLess":"≪","NewLine":"\n","nexist":"∄","nexists":"∄","Nfr":"𝔑","nfr":"𝔫","ngE":"≧̸","nge":"≱","ngeq":"≱","ngeqq":"≧̸","ngeqslant":"⩾̸","nges":"⩾̸","nGg":"⋙̸","ngsim":"≵","nGt":"≫⃒","ngt":"≯","ngtr":"≯","nGtv":"≫̸","nhArr":"⇎","nharr":"↮","nhpar":"⫲","ni":"∋","nis":"⋼","nisd":"⋺","niv":"∋","NJcy":"Њ","njcy":"њ","nlArr":"⇍","nlarr":"↚","nldr":"‥","nlE":"≦̸","nle":"≰","nLeftarrow":"⇍","nleftarrow":"↚","nLeftrightarrow":"⇎","nleftrightarrow":"↮","nleq":"≰","nleqq":"≦̸","nleqslant":"⩽̸","nles":"⩽̸","nless":"≮","nLl":"⋘̸","nlsim":"≴","nLt":"≪⃒","nlt":"≮","nltri":"⋪","nltrie":"⋬","nLtv":"≪̸","nmid":"∤","NoBreak":"⁠","NonBreakingSpace":" ","Nopf":"ℕ","nopf":"𝕟","Not":"⫬","not":"¬","NotCongruent":"≢","NotCupCap":"≭","NotDoubleVerticalBar":"∦","NotElement":"∉","NotEqual":"≠","NotEqualTilde":"≂̸","NotExists":"∄","NotGreater":"≯","NotGreaterEqual":"≱","NotGreaterFullEqual":"≧̸","NotGreaterGreater":"≫̸","NotGreaterLess":"≹","NotGreaterSlantEqual":"⩾̸","NotGreaterTilde":"≵","NotHumpDownHump":"≎̸","NotHumpEqual":"≏̸","notin":"∉","notindot":"⋵̸","notinE":"⋹̸","notinva":"∉","notinvb":"⋷","notinvc":"⋶","NotLeftTriangle":"⋪","NotLeftTriangleBar":"⧏̸","NotLeftTriangleEqual":"⋬","NotLess":"≮","NotLessEqual":"≰","NotLessGreater":"≸","NotLessLess":"≪̸","NotLessSlantEqual":"⩽̸","NotLessTilde":"≴","NotNestedGreaterGreater":"⪢̸","NotNestedLessLess":"⪡̸","notni":"∌","notniva":"∌","notnivb":"⋾","notnivc":"⋽","NotPrecedes":"⊀","NotPrecedesEqual":"⪯̸","NotPrecedesSlantEqual":"⋠","NotReverseElement":"∌","NotRightTriangle":"⋫","NotRightTriangleBar":"⧐̸","NotRightTriangleEqual":"⋭","NotSquareSubset":"⊏̸","NotSquareSubsetEqual":"⋢","NotSquareSuperset":"⊐̸","NotSquareSupersetEqual":"⋣","NotSubset":"⊂⃒","NotSubsetEqual":"⊈","NotSucceeds":"⊁","NotSucceedsEqual":"⪰̸","NotSucceedsSlantEqual":"⋡","NotSucceedsTilde":"≿̸","NotSuperset":"⊃⃒","NotSupersetEqual":"⊉","NotTilde":"≁","NotTildeEqual":"≄","NotTildeFullEqual":"≇","NotTildeTilde":"≉","NotVerticalBar":"∤","npar":"∦","nparallel":"∦","nparsl":"⫽⃥","npart":"∂̸","npolint":"⨔","npr":"⊀","nprcue":"⋠","npre":"⪯̸","nprec":"⊀","npreceq":"⪯̸","nrArr":"⇏","nrarr":"↛","nrarrc":"⤳̸","nrarrw":"↝̸","nRightarrow":"⇏","nrightarrow":"↛","nrtri":"⋫","nrtrie":"⋭","nsc":"⊁","nsccue":"⋡","nsce":"⪰̸","Nscr":"𝒩","nscr":"𝓃","nshortmid":"∤","nshortparallel":"∦","nsim":"≁","nsime":"≄","nsimeq":"≄","nsmid":"∤","nspar":"∦","nsqsube":"⋢","nsqsupe":"⋣","nsub":"⊄","nsubE":"⫅̸","nsube":"⊈","nsubset":"⊂⃒","nsubseteq":"⊈","nsubseteqq":"⫅̸","nsucc":"⊁","nsucceq":"⪰̸","nsup":"⊅","nsupE":"⫆̸","nsupe":"⊉","nsupset":"⊃⃒","nsupseteq":"⊉","nsupseteqq":"⫆̸","ntgl":"≹","Ntilde":"Ñ","ntilde":"ñ","ntlg":"≸","ntriangleleft":"⋪","ntrianglelefteq":"⋬","ntriangleright":"⋫","ntrianglerighteq":"⋭","Nu":"Ν","nu":"ν","num":"#","numero":"№","numsp":" ","nvap":"≍⃒","nVDash":"⊯","nVdash":"⊮","nvDash":"⊭","nvdash":"⊬","nvge":"≥⃒","nvgt":">⃒","nvHarr":"⤄","nvinfin":"⧞","nvlArr":"⤂","nvle":"≤⃒","nvlt":"<⃒","nvltrie":"⊴⃒","nvrArr":"⤃","nvrtrie":"⊵⃒","nvsim":"∼⃒","nwarhk":"⤣","nwArr":"⇖","nwarr":"↖","nwarrow":"↖","nwnear":"⤧","Oacute":"Ó","oacute":"ó","oast":"⊛","ocir":"⊚","Ocirc":"Ô","ocirc":"ô","Ocy":"О","ocy":"о","odash":"⊝","Odblac":"Ő","odblac":"ő","odiv":"⨸","odot":"⊙","odsold":"⦼","OElig":"Œ","oelig":"œ","ofcir":"⦿","Ofr":"𝔒","ofr":"𝔬","ogon":"˛","Ograve":"Ò","ograve":"ò","ogt":"⧁","ohbar":"⦵","ohm":"Ω","oint":"∮","olarr":"↺","olcir":"⦾","olcross":"⦻","oline":"‾","olt":"⧀","Omacr":"Ō","omacr":"ō","Omega":"Ω","omega":"ω","Omicron":"Ο","omicron":"ο","omid":"⦶","ominus":"⊖","Oopf":"𝕆","oopf":"𝕠","opar":"⦷","OpenCurlyDoubleQuote":"“","OpenCurlyQuote":"‘","operp":"⦹","oplus":"⊕","Or":"⩔","or":"∨","orarr":"↻","ord":"⩝","order":"ℴ","orderof":"ℴ","ordf":"ª","ordm":"º","origof":"⊶","oror":"⩖","orslope":"⩗","orv":"⩛","oS":"Ⓢ","Oscr":"𝒪","oscr":"ℴ","Oslash":"Ø","oslash":"ø","osol":"⊘","Otilde":"Õ","otilde":"õ","Otimes":"⨷","otimes":"⊗","otimesas":"⨶","Ouml":"Ö","ouml":"ö","ovbar":"⌽","OverBar":"‾","OverBrace":"⏞","OverBracket":"⎴","OverParenthesis":"⏜","par":"∥","para":"¶","parallel":"∥","parsim":"⫳","parsl":"⫽","part":"∂","PartialD":"∂","Pcy":"П","pcy":"п","percnt":"%","period":".","permil":"‰","perp":"⊥","pertenk":"‱","Pfr":"𝔓","pfr":"𝔭","Phi":"Φ","phi":"φ","phiv":"ϕ","phmmat":"ℳ","phone":"☎","Pi":"Π","pi":"π","pitchfork":"⋔","piv":"ϖ","planck":"ℏ","planckh":"ℎ","plankv":"ℏ","plus":"+","plusacir":"⨣","plusb":"⊞","pluscir":"⨢","plusdo":"∔","plusdu":"⨥","pluse":"⩲","PlusMinus":"±","plusmn":"±","plussim":"⨦","plustwo":"⨧","pm":"±","Poincareplane":"ℌ","pointint":"⨕","Popf":"ℙ","popf":"𝕡","pound":"£","Pr":"⪻","pr":"≺","prap":"⪷","prcue":"≼","prE":"⪳","pre":"⪯","prec":"≺","precapprox":"⪷","preccurlyeq":"≼","Precedes":"≺","PrecedesEqual":"⪯","PrecedesSlantEqual":"≼","PrecedesTilde":"≾","preceq":"⪯","precnapprox":"⪹","precneqq":"⪵","precnsim":"⋨","precsim":"≾","Prime":"″","prime":"′","primes":"ℙ","prnap":"⪹","prnE":"⪵","prnsim":"⋨","prod":"∏","Product":"∏","profalar":"⌮","profline":"⌒","profsurf":"⌓","prop":"∝","Proportion":"∷","Proportional":"∝","propto":"∝","prsim":"≾","prurel":"⊰","Pscr":"𝒫","pscr":"𝓅","Psi":"Ψ","psi":"ψ","puncsp":" ","Qfr":"𝔔","qfr":"𝔮","qint":"⨌","Qopf":"ℚ","qopf":"𝕢","qprime":"⁗","Qscr":"𝒬","qscr":"𝓆","quaternions":"ℍ","quatint":"⨖","quest":"?","questeq":"≟","QUOT":"\"","quot":"\"","rAarr":"⇛","race":"∽̱","Racute":"Ŕ","racute":"ŕ","radic":"√","raemptyv":"⦳","Rang":"⟫","rang":"⟩","rangd":"⦒","range":"⦥","rangle":"⟩","raquo":"»","Rarr":"↠","rArr":"⇒","rarr":"→","rarrap":"⥵","rarrb":"⇥","rarrbfs":"⤠","rarrc":"⤳","rarrfs":"⤞","rarrhk":"↪","rarrlp":"↬","rarrpl":"⥅","rarrsim":"⥴","Rarrtl":"⤖","rarrtl":"↣","rarrw":"↝","rAtail":"⤜","ratail":"⤚","ratio":"∶","rationals":"ℚ","RBarr":"⤐","rBarr":"⤏","rbarr":"⤍","rbbrk":"❳","rbrace":"}","rbrack":"]","rbrke":"⦌","rbrksld":"⦎","rbrkslu":"⦐","Rcaron":"Ř","rcaron":"ř","Rcedil":"Ŗ","rcedil":"ŗ","rceil":"⌉","rcub":"}","Rcy":"Р","rcy":"р","rdca":"⤷","rdldhar":"⥩","rdquo":"”","rdquor":"”","rdsh":"↳","Re":"ℜ","real":"ℜ","realine":"ℛ","realpart":"ℜ","reals":"ℝ","rect":"▭","REG":"®","reg":"®","ReverseElement":"∋","ReverseEquilibrium":"⇋","ReverseUpEquilibrium":"⥯","rfisht":"⥽","rfloor":"⌋","Rfr":"ℜ","rfr":"𝔯","rHar":"⥤","rhard":"⇁","rharu":"⇀","rharul":"⥬","Rho":"Ρ","rho":"ρ","rhov":"ϱ","RightAngleBracket":"⟩","RightArrow":"→","Rightarrow":"⇒","rightarrow":"→","RightArrowBar":"⇥","RightArrowLeftArrow":"⇄","rightarrowtail":"↣","RightCeiling":"⌉","RightDoubleBracket":"⟧","RightDownTeeVector":"⥝","RightDownVector":"⇂","RightDownVectorBar":"⥕","RightFloor":"⌋","rightharpoondown":"⇁","rightharpoonup":"⇀","rightleftarrows":"⇄","rightleftharpoons":"⇌","rightrightarrows":"⇉","rightsquigarrow":"↝","RightTee":"⊢","RightTeeArrow":"↦","RightTeeVector":"⥛","rightthreetimes":"⋌","RightTriangle":"⊳","RightTriangleBar":"⧐","RightTriangleEqual":"⊵","RightUpDownVector":"⥏","RightUpTeeVector":"⥜","RightUpVector":"↾","RightUpVectorBar":"⥔","RightVector":"⇀","RightVectorBar":"⥓","ring":"˚","risingdotseq":"≓","rlarr":"⇄","rlhar":"⇌","rlm":"‏","rmoust":"⎱","rmoustache":"⎱","rnmid":"⫮","roang":"⟭","roarr":"⇾","robrk":"⟧","ropar":"⦆","Ropf":"ℝ","ropf":"𝕣","roplus":"⨮","rotimes":"⨵","RoundImplies":"⥰","rpar":")","rpargt":"⦔","rppolint":"⨒","rrarr":"⇉","Rrightarrow":"⇛","rsaquo":"›","Rscr":"ℛ","rscr":"𝓇","Rsh":"↱","rsh":"↱","rsqb":"]","rsquo":"’","rsquor":"’","rthree":"⋌","rtimes":"⋊","rtri":"▹","rtrie":"⊵","rtrif":"▸","rtriltri":"⧎","RuleDelayed":"⧴","ruluhar":"⥨","rx":"℞","Sacute":"Ś","sacute":"ś","sbquo":"‚","Sc":"⪼","sc":"≻","scap":"⪸","Scaron":"Š","scaron":"š","sccue":"≽","scE":"⪴","sce":"⪰","Scedil":"Ş","scedil":"ş","Scirc":"Ŝ","scirc":"ŝ","scnap":"⪺","scnE":"⪶","scnsim":"⋩","scpolint":"⨓","scsim":"≿","Scy":"С","scy":"с","sdot":"⋅","sdotb":"⊡","sdote":"⩦","searhk":"⤥","seArr":"⇘","searr":"↘","searrow":"↘","sect":"§","semi":";","seswar":"⤩","setminus":"∖","setmn":"∖","sext":"✶","Sfr":"𝔖","sfr":"𝔰","sfrown":"⌢","sharp":"♯","SHCHcy":"Щ","shchcy":"щ","SHcy":"Ш","shcy":"ш","ShortDownArrow":"↓","ShortLeftArrow":"←","shortmid":"∣","shortparallel":"∥","ShortRightArrow":"→","ShortUpArrow":"↑","shy":"­","Sigma":"Σ","sigma":"σ","sigmaf":"ς","sigmav":"ς","sim":"∼","simdot":"⩪","sime":"≃","simeq":"≃","simg":"⪞","simgE":"⪠","siml":"⪝","simlE":"⪟","simne":"≆","simplus":"⨤","simrarr":"⥲","slarr":"←","SmallCircle":"∘","smallsetminus":"∖","smashp":"⨳","smeparsl":"⧤","smid":"∣","smile":"⌣","smt":"⪪","smte":"⪬","smtes":"⪬︀","SOFTcy":"Ь","softcy":"ь","sol":"/","solb":"⧄","solbar":"⌿","Sopf":"𝕊","sopf":"𝕤","spades":"♠","spadesuit":"♠","spar":"∥","sqcap":"⊓","sqcaps":"⊓︀","sqcup":"⊔","sqcups":"⊔︀","Sqrt":"√","sqsub":"⊏","sqsube":"⊑","sqsubset":"⊏","sqsubseteq":"⊑","sqsup":"⊐","sqsupe":"⊒","sqsupset":"⊐","sqsupseteq":"⊒","squ":"□","Square":"□","square":"□","SquareIntersection":"⊓","SquareSubset":"⊏","SquareSubsetEqual":"⊑","SquareSuperset":"⊐","SquareSupersetEqual":"⊒","SquareUnion":"⊔","squarf":"▪","squf":"▪","srarr":"→","Sscr":"𝒮","sscr":"𝓈","ssetmn":"∖","ssmile":"⌣","sstarf":"⋆","Star":"⋆","star":"☆","starf":"★","straightepsilon":"ϵ","straightphi":"ϕ","strns":"¯","Sub":"⋐","sub":"⊂","subdot":"⪽","subE":"⫅","sube":"⊆","subedot":"⫃","submult":"⫁","subnE":"⫋","subne":"⊊","subplus":"⪿","subrarr":"⥹","Subset":"⋐","subset":"⊂","subseteq":"⊆","subseteqq":"⫅","SubsetEqual":"⊆","subsetneq":"⊊","subsetneqq":"⫋","subsim":"⫇","subsub":"⫕","subsup":"⫓","succ":"≻","succapprox":"⪸","succcurlyeq":"≽","Succeeds":"≻","SucceedsEqual":"⪰","SucceedsSlantEqual":"≽","SucceedsTilde":"≿","succeq":"⪰","succnapprox":"⪺","succneqq":"⪶","succnsim":"⋩","succsim":"≿","SuchThat":"∋","Sum":"∑","sum":"∑","sung":"♪","sup1":"¹","sup2":"²","sup3":"³","Sup":"⋑","sup":"⊃","supdot":"⪾","supdsub":"⫘","supE":"⫆","supe":"⊇","supedot":"⫄","Superset":"⊃","SupersetEqual":"⊇","suphsol":"⟉","suphsub":"⫗","suplarr":"⥻","supmult":"⫂","supnE":"⫌","supne":"⊋","supplus":"⫀","Supset":"⋑","supset":"⊃","supseteq":"⊇","supseteqq":"⫆","supsetneq":"⊋","supsetneqq":"⫌","supsim":"⫈","supsub":"⫔","supsup":"⫖","swarhk":"⤦","swArr":"⇙","swarr":"↙","swarrow":"↙","swnwar":"⤪","szlig":"ß","Tab":"\t","target":"⌖","Tau":"Τ","tau":"τ","tbrk":"⎴","Tcaron":"Ť","tcaron":"ť","Tcedil":"Ţ","tcedil":"ţ","Tcy":"Т","tcy":"т","tdot":"⃛","telrec":"⌕","Tfr":"𝔗","tfr":"𝔱","there4":"∴","Therefore":"∴","therefore":"∴","Theta":"Θ","theta":"θ","thetasym":"ϑ","thetav":"ϑ","thickapprox":"≈","thicksim":"∼","ThickSpace":"  ","thinsp":" ","ThinSpace":" ","thkap":"≈","thksim":"∼","THORN":"Þ","thorn":"þ","Tilde":"∼","tilde":"˜","TildeEqual":"≃","TildeFullEqual":"≅","TildeTilde":"≈","times":"×","timesb":"⊠","timesbar":"⨱","timesd":"⨰","tint":"∭","toea":"⤨","top":"⊤","topbot":"⌶","topcir":"⫱","Topf":"𝕋","topf":"𝕥","topfork":"⫚","tosa":"⤩","tprime":"‴","TRADE":"™","trade":"™","triangle":"▵","triangledown":"▿","triangleleft":"◃","trianglelefteq":"⊴","triangleq":"≜","triangleright":"▹","trianglerighteq":"⊵","tridot":"◬","trie":"≜","triminus":"⨺","TripleDot":"⃛","triplus":"⨹","trisb":"⧍","tritime":"⨻","trpezium":"⏢","Tscr":"𝒯","tscr":"𝓉","TScy":"Ц","tscy":"ц","TSHcy":"Ћ","tshcy":"ћ","Tstrok":"Ŧ","tstrok":"ŧ","twixt":"≬","twoheadleftarrow":"↞","twoheadrightarrow":"↠","Uacute":"Ú","uacute":"ú","Uarr":"↟","uArr":"⇑","uarr":"↑","Uarrocir":"⥉","Ubrcy":"Ў","ubrcy":"ў","Ubreve":"Ŭ","ubreve":"ŭ","Ucirc":"Û","ucirc":"û","Ucy":"У","ucy":"у","udarr":"⇅","Udblac":"Ű","udblac":"ű","udhar":"⥮","ufisht":"⥾","Ufr":"𝔘","ufr":"𝔲","Ugrave":"Ù","ugrave":"ù","uHar":"⥣","uharl":"↿","uharr":"↾","uhblk":"▀","ulcorn":"⌜","ulcorner":"⌜","ulcrop":"⌏","ultri":"◸","Umacr":"Ū","umacr":"ū","uml":"¨","UnderBar":"_","UnderBrace":"⏟","UnderBracket":"⎵","UnderParenthesis":"⏝","Union":"⋃","UnionPlus":"⊎","Uogon":"Ų","uogon":"ų","Uopf":"𝕌","uopf":"𝕦","UpArrow":"↑","Uparrow":"⇑","uparrow":"↑","UpArrowBar":"⤒","UpArrowDownArrow":"⇅","UpDownArrow":"↕","Updownarrow":"⇕","updownarrow":"↕","UpEquilibrium":"⥮","upharpoonleft":"↿","upharpoonright":"↾","uplus":"⊎","UpperLeftArrow":"↖","UpperRightArrow":"↗","Upsi":"ϒ","upsi":"υ","upsih":"ϒ","Upsilon":"Υ","upsilon":"υ","UpTee":"⊥","UpTeeArrow":"↥","upuparrows":"⇈","urcorn":"⌝","urcorner":"⌝","urcrop":"⌎","Uring":"Ů","uring":"ů","urtri":"◹","Uscr":"𝒰","uscr":"𝓊","utdot":"⋰","Utilde":"Ũ","utilde":"ũ","utri":"▵","utrif":"▴","uuarr":"⇈","Uuml":"Ü","uuml":"ü","uwangle":"⦧","vangrt":"⦜","varepsilon":"ϵ","varkappa":"ϰ","varnothing":"∅","varphi":"ϕ","varpi":"ϖ","varpropto":"∝","vArr":"⇕","varr":"↕","varrho":"ϱ","varsigma":"ς","varsubsetneq":"⊊︀","varsubsetneqq":"⫋︀","varsupsetneq":"⊋︀","varsupsetneqq":"⫌︀","vartheta":"ϑ","vartriangleleft":"⊲","vartriangleright":"⊳","Vbar":"⫫","vBar":"⫨","vBarv":"⫩","Vcy":"В","vcy":"в","VDash":"⊫","Vdash":"⊩","vDash":"⊨","vdash":"⊢","Vdashl":"⫦","Vee":"⋁","vee":"∨","veebar":"⊻","veeeq":"≚","vellip":"⋮","Verbar":"‖","verbar":"|","Vert":"‖","vert":"|","VerticalBar":"∣","VerticalLine":"|","VerticalSeparator":"❘","VerticalTilde":"≀","VeryThinSpace":" ","Vfr":"𝔙","vfr":"𝔳","vltri":"⊲","vnsub":"⊂⃒","vnsup":"⊃⃒","Vopf":"𝕍","vopf":"𝕧","vprop":"∝","vrtri":"⊳","Vscr":"𝒱","vscr":"𝓋","vsubnE":"⫋︀","vsubne":"⊊︀","vsupnE":"⫌︀","vsupne":"⊋︀","Vvdash":"⊪","vzigzag":"⦚","Wcirc":"Ŵ","wcirc":"ŵ","wedbar":"⩟","Wedge":"⋀","wedge":"∧","wedgeq":"≙","weierp":"℘","Wfr":"𝔚","wfr":"𝔴","Wopf":"𝕎","wopf":"𝕨","wp":"℘","wr":"≀","wreath":"≀","Wscr":"𝒲","wscr":"𝓌","xcap":"⋂","xcirc":"◯","xcup":"⋃","xdtri":"▽","Xfr":"𝔛","xfr":"𝔵","xhArr":"⟺","xharr":"⟷","Xi":"Ξ","xi":"ξ","xlArr":"⟸","xlarr":"⟵","xmap":"⟼","xnis":"⋻","xodot":"⨀","Xopf":"𝕏","xopf":"𝕩","xoplus":"⨁","xotime":"⨂","xrArr":"⟹","xrarr":"⟶","Xscr":"𝒳","xscr":"𝓍","xsqcup":"⨆","xuplus":"⨄","xutri":"△","xvee":"⋁","xwedge":"⋀","Yacute":"Ý","yacute":"ý","YAcy":"Я","yacy":"я","Ycirc":"Ŷ","ycirc":"ŷ","Ycy":"Ы","ycy":"ы","yen":"¥","Yfr":"𝔜","yfr":"𝔶","YIcy":"Ї","yicy":"ї","Yopf":"𝕐","yopf":"𝕪","Yscr":"𝒴","yscr":"𝓎","YUcy":"Ю","yucy":"ю","Yuml":"Ÿ","yuml":"ÿ","Zacute":"Ź","zacute":"ź","Zcaron":"Ž","zcaron":"ž","Zcy":"З","zcy":"з","Zdot":"Ż","zdot":"ż","zeetrf":"ℨ","ZeroWidthSpace":"​","Zeta":"Ζ","zeta":"ζ","Zfr":"ℨ","zfr":"𝔷","ZHcy":"Ж","zhcy":"ж","zigrarr":"⇝","Zopf":"ℤ","zopf":"𝕫","Zscr":"𝒵","zscr":"𝓏","zwj":"‍","zwnj":"‌"});
const LEGACY_ENTITIES = new Set(["Aacute","aacute","Acirc","acirc","acute","AElig","aelig","Agrave","agrave","AMP","amp","Aring","aring","Atilde","atilde","Auml","auml","brvbar","Ccedil","ccedil","cedil","cent","COPY","copy","curren","deg","divide","Eacute","eacute","Ecirc","ecirc","Egrave","egrave","ETH","eth","Euml","euml","frac12","frac14","frac34","GT","gt","Iacute","iacute","Icirc","icirc","iexcl","Igrave","igrave","iquest","Iuml","iuml","laquo","LT","lt","macr","micro","middot","nbsp","not","Ntilde","ntilde","Oacute","oacute","Ocirc","ocirc","Ograve","ograve","ordf","ordm","Oslash","oslash","Otilde","otilde","Ouml","ouml","para","plusmn","pound","QUOT","quot","raquo","REG","reg","sect","shy","sup1","sup2","sup3","szlig","THORN","thorn","times","Uacute","uacute","Ucirc","ucirc","Ugrave","ugrave","uml","Uuml","uuml","Yacute","yacute","yen","yuml"]);
const C1 = { 128: 0x20ac, 130: 0x201a, 131: 0x0192, 132: 0x201e, 133: 0x2026, 134: 0x2020, 135: 0x2021, 136: 0x02c6, 137: 0x2030, 138: 0x0160, 139: 0x2039, 140: 0x0152, 142: 0x017d, 145: 0x2018, 146: 0x2019, 147: 0x201c, 148: 0x201d, 149: 0x2022, 150: 0x2013, 151: 0x2014, 152: 0x02dc, 153: 0x2122, 154: 0x0161, 155: 0x203a, 156: 0x0153, 158: 0x017e, 159: 0x0178 };

export class ConversionError extends Error {
  constructor(diagnostics) {
    super(diagnostics.map((d) => `${d.code}: ${d.message}${d.offset === undefined ? '' : ` at HTML offset ${d.offset}`}`).join('\n'));
    this.name = 'ConversionError';
    this.diagnostics = diagnostics;
  }
}

function fail(message, offset) {
  throw new ConversionError([{ code: 'MALFORMED_HTML', classification: 'unsupported', message, offset }]);
}

function decodeEntities(value, attribute = false) {
  return value.replace(/&(#(?:[xX][\da-fA-F]+|\d+)|[a-zA-Z][a-zA-Z\d]*)(;?)/g, (whole, entity, semicolon, offset) => {
    if (entity[0] === '#') {
      const hex = entity[1]?.toLowerCase() === 'x';
      const point = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(point) || point <= 0 || point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)) return '\ufffd';
      return String.fromCodePoint(C1[point] ?? point);
    }
    if (semicolon && Object.hasOwn(HTML_ENTITIES, entity)) return HTML_ENTITIES[entity];
    // HTML uses the longest legacy prefix in text. Attribute contexts prohibit ambiguous suffixes.
    for (let length = entity.length; length > 0; length--) {
      const prefix = entity.slice(0, length);
      if (!LEGACY_ENTITIES.has(prefix)) continue;
      const following = entity[length] ?? value[offset + whole.length];
      if (attribute && /[=a-zA-Z\d]/.test(following ?? '')) return whole;
      return HTML_ENTITIES[prefix] + entity.slice(length) + semicolon;
    }
    return whole;
  });
}

function parseAttributes(source, baseOffset, namespace) {
  const attributes = Object.create(null);
  let cursor = 0;
  while (cursor < source.length) {
    while (/\s/.test(source[cursor] ?? '')) cursor++;
    if (cursor >= source.length) break;
    const start = cursor;
    while (cursor < source.length && !/[\s=/>]/.test(source[cursor])) cursor++;
    if (cursor === start) fail('Malformed HTML attribute', baseOffset + cursor);
    const rawName = source.slice(start, cursor);
    const name = namespace === 'svg' ? rawName : rawName.toLowerCase();
    if (Object.hasOwn(attributes, name)) fail(`Duplicate HTML attribute "${name}"`, baseOffset + start);
    while (/\s/.test(source[cursor] ?? '')) cursor++;
    let value = namespace === 'html' && BOOLEAN_ATTRIBUTES.has(name) ? true : '';
    if (source[cursor] === '=') {
      cursor++;
      while (/\s/.test(source[cursor] ?? '')) cursor++;
      const quote = source[cursor];
      if (quote === '"' || quote === "'") {
        cursor++;
        const valueStart = cursor;
        while (cursor < source.length && source[cursor] !== quote) cursor++;
        if (cursor >= source.length) fail(`Unterminated quoted value for "${name}"`, baseOffset + valueStart);
        value = source.slice(valueStart, cursor++);
      } else {
        const valueStart = cursor;
        while (cursor < source.length && !/[\s>]/.test(source[cursor])) cursor++;
        value = source.slice(valueStart, cursor);
        if (!value || /["'<=`]/.test(value)) fail(`Invalid unquoted value for "${name}"`, baseOffset + valueStart);
      }
    }
    attributes[name] = value === true ? true : decodeEntities(value, true);
  }
  return attributes;
}

function parseHtml(html) {
  if (typeof html !== 'string') throw new TypeError('convertHtml expects an HTML string');
  const root = { type: 'root', namespace: 'html', children: [] };
  const stack = [root];
  let cursor = 0;
  while (cursor < html.length) {
    if (html.startsWith('<!--', cursor)) {
      const end = html.indexOf('-->', cursor + 4);
      if (end < 0) fail('Unclosed HTML comment', cursor);
      stack.at(-1).children.push({ type: 'comment', value: html.slice(cursor, end + 3), offset: cursor });
      cursor = end + 3;
      continue;
    }
    if (html[cursor] !== '<') {
      const next = html.indexOf('<', cursor);
      const end = next < 0 ? html.length : next;
      stack.at(-1).children.push({ type: 'text', value: decodeEntities(html.slice(cursor, end)), offset: cursor });
      cursor = end;
      continue;
    }
    if (/^<!doctype\b/i.test(html.slice(cursor))) {
      const end = html.indexOf('>', cursor + 2);
      if (end < 0) fail('Unclosed doctype declaration', cursor);
      stack.at(-1).children.push({ type: 'declaration', value: html.slice(cursor, end + 1), offset: cursor });
      cursor = end + 1;
      continue;
    }
    if (html.startsWith('<!', cursor) || html.startsWith('<?', cursor)) fail('Unsupported HTML declaration', cursor);
    const close = /^<\s*\/\s*([A-Za-z][\w:-]*)\s*>/.exec(html.slice(cursor));
    if (close) {
      const tag = close[1].toLowerCase();
      const current = stack.at(-1);
      if (current.tag !== tag) fail(`Mismatched closing tag </${tag}>; expected </${current.tag}>`, cursor);
      current.endOffset = cursor + close[0].length;
      stack.pop();
      cursor += close[0].length;
      continue;
    }
    const open = /^<\s*([A-Za-z][\w:-]*)\b/.exec(html.slice(cursor));
    if (!open) {
      stack.at(-1).children.push({ type: 'text', value: '<', offset: cursor });
      cursor++;
      continue;
    }
    const tag = open[1].toLowerCase();
    const namespace = tag === 'svg' ? 'svg' : stack.at(-1).namespace;
    const start = cursor;
    let quote = '';
    let end = cursor + open[0].length;
    for (; end < html.length; end++) {
      const char = html[end];
      if (quote) { if (char === quote) quote = ''; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === '>') break;
    }
    if (end >= html.length) fail(`Unclosed opening tag <${tag}>`, cursor);
    const rawInside = html.slice(cursor + open[0].length, end);
    const selfClosing = /\/\s*$/.test(rawInside);
    if (selfClosing && namespace !== 'svg' && !VOID_TAGS.has(tag)) fail(`Self-closing non-void HTML <${tag}> would change nesting`, cursor);
    const attrsRaw = selfClosing ? rawInside.replace(/\/\s*$/, '') : rawInside;
    const attributes = parseAttributes(attrsRaw, cursor + open[0].length, namespace);
    cursor = end + 1;
    const node = { type: 'element', tag, namespace, attributes, children: [], offset: start };
    stack.at(-1).children.push(node);
    if (namespace === 'html' && RAW_TAGS.has(tag)) {
      const closePattern = new RegExp(`<\\/\\s*${tag}\\s*>`, 'ig');
      closePattern.lastIndex = cursor;
      const closing = closePattern.exec(html);
      if (!closing) fail(`Unclosed <${tag}> block`, cursor);
      const raw = html.slice(cursor, closing.index);
      if (raw) node.children.push({ type: 'text', value: tag === 'textarea' ? decodeEntities(raw) : raw, offset: cursor });
      node.endOffset = closePattern.lastIndex;
      cursor = closePattern.lastIndex;
      continue;
    }
    if (!selfClosing && !VOID_TAGS.has(tag)) stack.push(node);
    else node.endOffset = cursor;
  }
  if (stack.length !== 1) fail(`Unclosed <${stack.at(-1).tag}> element`, html.length);
  return root.children;
}

export function classifyTag(tag, ownerTags = OWNER_TAGS) {
  tag = tag.toLowerCase();
  if (RUNTIME_TAGS.has(tag)) return 'runtime-only';
  if (tag === 'style') return 'style-block';
  if (!SEMANTIC_TAGS.has(tag)) return 'unsupported';
  return ownerTags.has(tag) ? 'native' : 'owner-schema-gap';
}

function hasExactAttributes(node, keys) {
  const actual = Object.keys(node.attributes).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

function runtimeExceptionFor(node, options = {}) {
  const rules = options.runtimeExceptions ?? [];
  return rules.find((rule) => {
    if (rule.route !== options.route || rule.componentId !== options.componentId) return false;
    let matches = false;
    if (rule.kind === 'external-script') matches = node.tag === 'script' && hasExactAttributes(node, ['src', 'defer']) && node.attributes.src === 'assets/js/home-interactive-discovery.js' && node.attributes.defer === true && node.children.length === 0;
    if (rule.kind === 'isolated-frame') matches = node.tag === 'iframe' && hasExactAttributes(node, ['class', 'data-player-frame', 'src', 'title', 'loading', 'referrerpolicy', 'sandbox', 'allow', 'allowfullscreen']) && node.attributes.class === 'wo002-player-frame' && node.attributes['data-player-frame'] === '' && node.attributes.src === '/public/games/wicked-bites/index.html' && node.attributes.title === 'Wicked Bites browser preview' && node.attributes.loading === 'eager' && node.attributes.referrerpolicy === 'origin' && node.attributes.sandbox === 'allow-scripts allow-pointer-lock' && node.attributes.allow === 'fullscreen' && node.attributes.allowfullscreen === true && node.children.length === 0;
    if (rule.kind === 'dynamic-image') matches = node.tag === 'img' && hasExactAttributes(node, ['data-reader-page', 'alt', 'decoding']) && node.attributes['data-reader-page'] === '' && node.attributes.alt === '' && node.attributes.decoding === 'async' && node.attributes.src === undefined;
    if (!matches || !Number.isInteger(node.endOffset) || !options.html) return false;
    return Buffer.byteLength(options.html.slice(node.offset, node.endOffset), 'utf8') <= rule.maxBytes;
  }) ?? null;
}

function diagnosticsFor(nodes, options = {}) {
  const { ownerTags = OWNER_TAGS, route = '/' } = options;
  const diagnostics = [];
  const visit = (node, insideLink = false) => {
    if (node.type === 'text') return;
    const add = (code, message, classification = 'unsupported') => diagnostics.push({ code, message, classification, tag: node.tag, offset: node.offset });
    if (node.type !== 'element') { add('UNREPRESENTABLE_CONTENT', `${node.type} has no native component representation`); return; }
    const classification = classifyTag(node.tag, ownerTags);
    const runtimeException = runtimeExceptionFor(node, { ...options, route });
    if (classification !== 'native' && !runtimeException) add(classification === 'runtime-only' ? 'RUNTIME_ONLY_CONTENT' : classification === 'owner-schema-gap' ? 'OWNER_SCHEMA_GAP' : 'UNSUPPORTED_TAG', `<${node.tag}> is ${classification}; an explicit renderer/host policy is required`, classification);
    if (node.tag === 'img' && !node.attributes.src && !runtimeException) {
      const runtimeSlot = Object.keys(node.attributes).some((key) => key.startsWith('data-'));
      add(runtimeSlot ? 'RUNTIME_ASSET_SLOT' : 'MISSING_IMAGE_SOURCE', runtimeSlot ? 'Image source is populated by runtime data; it cannot become a fixed catalog image' : '<img> has no static image source', runtimeSlot ? 'runtime-only' : 'asset');
    }
    for (const [key, value] of Object.entries(node.attributes)) {
      if (!/^[A-Za-z_][\w:.-]*$/.test(key) || /^on/i.test(key) || key.toLowerCase() === 'srcdoc') add('UNSAFE_ATTRIBUTE', `Unsupported active or malformed attribute "${key}" on <${node.tag}>`);
      if (/^\s*(?:javascript|vbscript|data):/i.test(String(value))) add('UNSAFE_ATTRIBUTE', `Unsafe attribute value for "${key}" on <${node.tag}>`);
      if (key === 'href' && node.namespace === 'svg' && node.tag !== 'a') add('UNSUPPORTED_SVG_REFERENCE', `href on SVG <${node.tag}> requires an explicit resource policy`, 'runtime-only');
      if (key === 'href' && (['form', 'fieldset', 'select', 'option', 'textarea', 'input'].includes(node.tag) || VOID_TAGS.has(node.tag) && node.tag !== 'img')) add('UNSUPPORTED_URL_PROPERTY', `A navigation href cannot preserve the field/void semantics of <${node.tag}>`);
      if (key === 'src' && node.tag !== 'img' && classification === 'native') add('UNSUPPORTED_ASSET_PROPERTY', `src on <${node.tag}> requires a typed media asset renderer`);
      if (key === 'xlink:href') add('UNSUPPORTED_SVG_REFERENCE', 'SVG references require an explicit resource policy', 'runtime-only');
      if (key === 'srcset' && /(?:^|[,\s])(?:javascript|vbscript|data):/i.test(String(value))) add('UNSAFE_ATTRIBUTE', 'Unsafe srcset URL');
    }
    if (Object.hasOwn(node.attributes, 'href')) {
      try { resolveHref(node.attributes.href, route); } catch (error) { add('INVALID_ROUTE', error.message); }
    }
    const isLink = node.tag === 'a' || !!node.attributes.href;
    if (insideLink && isLink) add('NESTED_LINK', 'Nested navigation links would produce nested anchors');
    if (node.attributes.target && !['_self', '_blank'].includes(node.attributes.target)) add('INVALID_TARGET', `Unsupported target "${node.attributes.target}"`);
    if (node.attributes.target && !node.attributes.href) add('OWNER_PROPERTY_GAP', 'The current owner renderer emits typed target only with a navigation href', 'owner-schema-gap');
    if (/(?:expression\s*\(|javascript\s*:|@import)/i.test(node.attributes.style ?? '')) add('UNSAFE_STYLE', 'Unsafe inline CSS');
    for (const child of node.children) visit(child, insideLink || isLink);
  };
  for (const node of nodes) visit(node);
  return diagnostics;
}

export function resolveHref(href, route = '/') {
  if (typeof href !== 'string' || !href) throw new Error('Empty href cannot be represented by the current owner renderer');
  if (/[\\\u0000-\u0020]/.test(href)) throw new Error(`Invalid characters in link "${href}"`);
  if (/^(\/[^/]|\/$|#|https?:\/\/|mailto:|tel:)/i.test(href)) return href;
  if (/^[a-z][\w+.-]*:|^\/\//i.test(href)) throw new Error(`Unsupported link destination "${href}"`);
  const resolved = new URL(href, new URL(route, 'https://owner-native.invalid'));
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

/** Read-only classification. Active content and renderer gaps remain visible rather than disappearing. */
export function inspectHtml(html, options = {}) {
  try {
    const nodes = parseHtml(html);
    const tags = new Set();
    const collect = (xs) => { for (const n of xs) if (n.type === 'element') { tags.add(n.tag); collect(n.children); } };
    collect(nodes);
    const diagnostics = diagnosticsFor(nodes, options);
    const warnings = [];
    const collectWarnings = (xs) => { for (const n of xs) if (n.type === 'element') {
      if (/url\s*\(/i.test(n.attributes.style ?? '') && !registeredBackgroundUrl(n.attributes.style, options.assetForUrl, { route: options.route ?? '/', referenceDist: options.referenceDist ?? 'reference' })) warnings.push({ code: 'CSS_ASSET_IDENTITY_PENDING', classification: 'asset-advisory', tag: n.tag, offset: n.offset, message: 'Original inline CSS is preserved; an unregistered CSS URL has no typed asset identity yet' });
      collectWarnings(n.children);
    } };
    collectWarnings(nodes);
    return { valid: !diagnostics.length, tags: [...tags].sort(), diagnostics, warnings };
  } catch (error) {
    if (!(error instanceof ConversionError)) throw error;
    return { valid: false, tags: [], diagnostics: error.diagnostics, warnings: [] };
  }
}

function slug(value) {
  return String(value ?? '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 56) || 'element';
}

function plainText(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(plainText).join('');
}

function hasElements(node) {
  return node.children.some((child) => child.type === 'element');
}

function titleFrom(node) {
  const alt = node.attributes.alt?.trim();
  if (alt) return alt;
  const id = node.attributes.id?.trim();
  if (id) return id.replace(/[-_]+/g, ' ');
  const heading = descendants(node, (child) => /^h[1-6]$/.test(child.tag))[0];
  const text = plainText(heading ?? node).trim().replace(/\s+/g, ' ');
  if (text) return text.slice(0, 72);
  const cls = (node.attributes.class ?? '').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
  return cls ? `${node.tag} ${cls}` : node.tag;
}

function descendants(node, predicate, found = []) {
  if (node.type !== 'element') return found;
  if (predicate(node)) found.push(node);
  for (const child of node.children) descendants(child, predicate, found);
  return found;
}

function removeDiscoveryButton(node, slugId) {
  node.children = node.children.filter((child) => !(child.type === 'element' && child.tag === 'button' && child.attributes['data-discover-character'] === slugId));
  for (const child of node.children) if (child.type === 'element') removeDiscoveryButton(child, slugId);
}

function replaceProfileAnchors(node, href) {
  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (child.tag === 'a' && child.attributes.href === href) {
      child.tag = 'span';
      delete child.attributes.href;
      delete child.attributes.target;
      delete child.attributes.rel;
    } else replaceProfileAnchors(child, href);
  }
}

function normalizeCharacterCard(node) {
  if (node.type !== 'element') return;
  for (const child of [...node.children]) normalizeCharacterCard(child);
  if (node.tag !== 'article' || !/(?:^|\s)character-card(?:\s|$)/.test(node.attributes.class ?? '') && !node.attributes['data-character-group']) return;
  const discoveryButton = descendants(node, (candidate) => candidate.tag === 'button' && !!candidate.attributes['data-discover-character'])[0];
  const slugId = node.attributes['data-discover-character'] ?? discoveryButton?.attributes['data-discover-character'];
  if (!slugId) return;
  node.attributes['data-discover-character'] = slugId;
  const profile = descendants(node, (candidate) => candidate.tag === 'a' && /^\/characters\/[^/?#]+\/?$/.test(candidate.attributes.href ?? ''))[0];
  removeDiscoveryButton(node, slugId);
  if (slugId === 'toadal' && profile) {
    const profileHref = profile.attributes.href;
    replaceProfileAnchors(node, profileHref);
    node.tag = 'a';
    node.attributes.href = profileHref;
    delete node.attributes.role;
    delete node.attributes.tabindex;
    delete node.attributes['aria-label'];
    return;
  }
  node.attributes.role = 'button';
  node.attributes.tabindex ??= '0';
  const heading = descendants(node, (child) => /^h[1-6]$/.test(child.tag))[0];
  node.attributes['aria-label'] ??= `Discover ${heading ? plainText(heading).trim() : titleFrom(node)} artwork`;
}

/** Conservative direct-sibling collection classification; headings, fields and mixed prose disqualify it. */
export function isSemanticCollection(node) {
  if (node.type !== 'element' || node.children.some((n) => n.type === 'text' && n.value.trim())) return false;
  const children = node.children.filter((n) => n.type === 'element');
  if (children.length < 2) return false;
  // These ordered runtime records are sequence contracts, not sortable artwork collections.
  if (children.some((n) => Object.hasOwn(n.attributes, 'data-daily-track-day'))) return false;
  if (['ul', 'ol'].includes(node.tag) || node.attributes.role === 'list') {
    return children.every((n) => n.tag === 'li' || n.attributes.role === 'listitem');
  }
  const parentMarker = /(?:^|[-_\s])(?:grid|list|rail|strip|cards|tiles)(?:[-_\s]|$)/.test(node.attributes.class ?? '');
  const cardMarker = (n) => /(?:^|[-_\s])(?:card|tile|item)(?:[-_\s]|$)/.test(n.attributes.class ?? '');
  return parentMarker && children.every((n) => cardMarker(n) || ['article', 'figure'].includes(n.tag));
}

function splitAttributes(node) {
  const attributes = { ...node.attributes };
  const className = attributes.class ?? '';
  delete attributes.class;
  const style = attributes.style ?? '';
  delete attributes.style;
  if (node.tag === 'img') {
    delete attributes.src;
    delete attributes.alt;
  }
  delete attributes.href;
  delete attributes.target;
  return { attributes, className, style };
}

function backgroundUrl(style) {
  const declarations = String(style).split(/;(?![^()]*\))/);
  const matches = declarations.filter((part) => /^\s*background(?:-image)?\s*:/i.test(part));
  if (matches.length !== 1) return null;
  const values = [...matches[0].slice(matches[0].indexOf(':') + 1).matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)];
  if (values.length !== 1 || !values[0][2].trim()) return null;
  return values[0][2].trim();
}

function registeredBackgroundUrl(style, assetForUrl, options) {
  const url = backgroundUrl(style);
  if (!url || typeof assetForUrl !== 'function' || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(url)) return null;
  try {
    const assetId = assetForUrl(url, { kind: 'background', ...options });
    return assetId ? { assetId, sourceUrl: url } : null;
  } catch { return null; }
}

function componentIdFor(rootId, treePath, label) {
  const prefix = rootId.slice(0, 180);
  const pathHash = createHash('sha256').update(`${rootId}\0${treePath}`).digest('hex').slice(0, 12);
  return `${prefix}.${pathHash}.${slug(label).slice(0, 24)}`;
}

function nativeNode(node, ctx, rootId, treePath) {
  if (node.type === 'text') {
    if (!node.value) return null;
    const id = componentIdFor(rootId, treePath, 'text');
    return {
      id,
      type: 'core.text',
      props: { authoringVersion: 1, tag: '#text', className: '', attributes: {}, style: '', text: node.value, layerName: `Text: ${node.value.trim().replace(/\s+/g, ' ').slice(0, 52) || 'whitespace'}` },
    };
  }

  const runtimeException = runtimeExceptionFor(node, { ...ctx, componentId: rootId });
  if (runtimeException) {
    const html = ctx.html.slice(node.offset, node.endOffset);
    return {
      id: componentIdFor(rootId, treePath, runtimeException.kind),
      type: 'core.rich-text',
      props: {
        html,
        runtimeOnly: true,
        readOnly: true,
        locked: true,
        runtimeVersion: 1,
        runtimeKind: runtimeException.kind,
        runtimeSha256: createHash('sha256').update(html, 'utf8').digest('hex'),
        runtimeCodeResources: runtimeException.policy.codeResources.map(({ url, sha256 }) => ({ url, sha256 })),
        runtimePolicy: { id: runtimeException.policy.id, mode: runtimeException.policy.mode, ...Object.fromEntries(Object.entries(runtimeException.policy).filter(([key]) => !['id', 'mode', 'codeResources'].includes(key))) },
        layerName: `Read-only runtime: ${runtimeException.kind}`,
      },
    };
  }

  const attrs = node.attributes;
  const { attributes, className, style } = splitAttributes(node);
  const backgroundAsset = registeredBackgroundUrl(style, ctx.assetForUrl, { route: ctx.route, referenceDist: ctx.referenceDist });
  const id = componentIdFor(rootId, treePath, attrs.id || attrs['data-discover-character'] || className || node.tag);
  const meta = {
    authoringVersion: 1, tag: node.tag, className, attributes, style,
    ...(backgroundAsset ? { backgroundAsset: backgroundAsset.assetId, backgroundSourceUrl: backgroundAsset.sourceUrl } : {}),
    layerName: titleFrom(node),
    ...(attrs.href === undefined ? {} : { href: resolveHref(attrs.href, ctx.route) }),
    ...(attrs.target === undefined ? {} : { target: attrs.target }),
  };

  if (node.tag === 'img') {
    const src = attrs.src;
    if (!src) fail(`<img> has no src (layer ${meta.layerName})`);
    const assetId = ctx.assetForUrl(src, { attributes: attrs, layerName: meta.layerName, route: ctx.route });
    if (typeof assetId !== 'string' || !assetId) throw new ConversionError([{ code: 'MISSING_ASSET', classification: 'asset', tag: 'img', offset: node.offset, message: `No catalog asset ID is resolved for "${src}" (${meta.layerName})` }]);
    return { id, type: 'core.image', props: { ...meta, asset: assetId, alt: attrs.alt ?? '' } };
  }

  const meaningfulChildren = node.children.map((child, childIndex) => nativeNode(child, ctx, rootId, `${treePath}.${childIndex}`)).filter(Boolean);
  if (node.tag === 'a' || node.tag === 'button') {
    const textOnly = !hasElements(node);
    const text = textOnly ? plainText(node) : undefined;
    const props = { ...meta };
    if (node.tag === 'a' && attrs.href != null) props.href = resolveHref(attrs.href, ctx.route);
    if (node.tag === 'a' && attrs.target != null) props.target = attrs.target;
    if (textOnly) props.label = text;
    else props.children = meaningfulChildren;
    return { id, type: 'core.button', props };
  }

  if (!hasElements(node) && !STRUCTURAL_TAGS.has(node.tag)) {
    return { id, type: 'core.text', props: { ...meta, text: plainText(node) } };
  }
  return { id, type: 'layout.container', props: { ...meta, mode: 'inherit', ...(isSemanticCollection(node) ? { collection: true } : {}), children: meaningfulChildren } };
}

/** Convert HTML into deterministic native Studio components without writing project data. */
export function convertHtml(html, { componentId, assetForUrl, variant, route = '/', layerName, ownerTags = OWNER_TAGS, normalizeCards = true, runtimeExceptions = [], referenceDist = 'reference' } = {}) {
  if (!componentId || typeof componentId !== 'string') throw new TypeError('convertHtml requires componentId');
  if (componentId.length > 240) throw new TypeError('Original componentId exceeds the Studio bridge limit of 240 characters');
  if (typeof assetForUrl !== 'function') throw new TypeError('convertHtml requires assetForUrl(url, context)');
  const rootId = componentId;
  const nodes = parseHtml(html);
  const diagnostics = diagnosticsFor(nodes, { ownerTags, route, componentId, runtimeExceptions, assetForUrl, referenceDist, html });
  if (diagnostics.length) throw new ConversionError(diagnostics);
  if (normalizeCards) for (const node of nodes) normalizeCharacterCard(node);
  const normalizedDiagnostics = diagnosticsFor(nodes, { ownerTags, route, componentId, runtimeExceptions, assetForUrl, referenceDist, html });
  if (normalizedDiagnostics.length) throw new ConversionError(normalizedDiagnostics);
  const children = nodes.map((node, index) => nativeNode(node, { assetForUrl, route, referenceDist, runtimeExceptions, html }, rootId, String(index))).filter(Boolean);
  return {
    id: rootId,
    type: 'layout.container',
    props: {
      authoringVersion: 1,
      tag: 'section',
      className: 'studio-rich-text shell section',
      attributes: {},
      style: '',
      ...(variant === undefined ? {} : { variant }),
      layerName: layerName ?? `${route} content`,
      mode: 'inherit',
      children,
    },
  };
}

/** Convert every rich-text component on a page while preserving page and component identity. */
export function convertPage(page, options = {}) {
  if (!page || !Array.isArray(page.components)) throw new TypeError('convertPage expects a Studio page with components');
  const visit = (component) => {
    if (component.type === 'core.rich-text') {
      if (typeof component.props?.html !== 'string') throw new TypeError(`Missing HTML string on ${component.id}`);
      const { html, ...originalProps } = component.props;
      const converted = convertHtml(html, { ...options, componentId: component.id, route: page.route, variant: originalProps.variant, layerName: originalProps.layerName ?? `${page.title ?? page.route} content` });
      return { ...component, type: converted.type, props: { ...originalProps, ...converted.props } };
    }
    const props = component.props;
    if (!props || typeof props !== 'object') return component;
    const next = { ...props };
    if (Array.isArray(props.children)) next.children = props.children.map(visit);
    if (props.slots && typeof props.slots === 'object' && !Array.isArray(props.slots)) next.slots = Object.fromEntries(Object.entries(props.slots).map(([slot, items]) => [slot, Array.isArray(items) ? items.map(visit) : items]));
    return { ...component, props: next };
  };
  const components = page.components.map(visit);
  return { ...page, components };
}

function parseArgs(argv) {
  const result = { allPages: false, pilotQualified: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--all-pages' || arg === '--pilot-qualified') {
      const key = arg === '--all-pages' ? 'allPages' : 'pilotQualified';
      if (result[key]) throw new Error(`Duplicate argument: ${arg}`);
      result[key] = true;
      continue;
    }
    if (!['--project', '--studio', '--page'].includes(arg)) throw new Error(`Unknown argument: ${arg}`);
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
    if (!path.isAbsolute(value)) throw new Error(`${arg} must be an absolute path`);
    const key = arg.slice(2);
    if (result[key]) throw new Error(`Duplicate argument: ${arg}`);
    result[key] = path.resolve(value);
  }
  for (const key of ['project', 'studio']) if (!result[key]) throw new Error(`Required argument: --${key} <absolute path>`);
  if (Boolean(result.page) === result.allPages) throw new Error('Choose exactly one scope: --page <absolute path> or --all-pages');
  if (!result.pilotQualified) throw new Error('Conversion requires --pilot-qualified after the Characters UI pilot has been qualified');
  return result;
}

export function referenceSourceForUrl(url, { route = '/', referenceDist = 'reference' } = {}) {
  if (typeof url !== 'string' || !url.trim()) throw new Error('Image src must be a non-empty URL');
  if (/^[a-z][\w+.-]*:|^\/\/|[\\\u0000-\u0020]/i.test(url)) return null;
  const decodedUrl = decodeURIComponent(url);
  if (decodedUrl.split(/[/?#]/).includes('..') || /\\|\u0000/.test(decodedUrl)) return null;
  const parsed = new URL(url, new URL(route, 'https://local.invalid'));
  if (parsed.origin !== 'https://local.invalid') return null;
  // The current asset renderer cannot retain URL suffixes on catalog IDs.
  if (parsed.search || parsed.hash) return null;
  const decoded = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
  if (!decoded.startsWith('assets/')) return null;
  return `${referenceDist.replace(/[\\/]+$/, '')}/${decoded}`.replaceAll('\\', '/');
}

export function catalogAssetForUrl(catalog, url, options = {}) {
  const exact = catalog.assets.find((asset) => asset.source === url);
  if (exact) return exact;
  const localSource = referenceSourceForUrl(url, options);
  if (!localSource) return null;
  return catalog.assets.find((asset) => asset.source?.replaceAll('\\', '/') === localSource) ?? null;
}

function inspectImage(bytes, ext) {
  if (ext === '.png' && bytes.length >= 24) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (ext === '.gif' && bytes.length >= 10) return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
  if (ext === '.webp' && bytes.length >= 30 && bytes.toString('ascii', 0, 4) === 'RIFF') {
    const kind = bytes.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
    if (kind === 'VP8 ') return { width: (bytes.readUInt16LE(26) & 0x3fff), height: (bytes.readUInt16LE(28) & 0x3fff) };
    if (kind === 'VP8L' && bytes[20] === 0x2f) return { width: 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]), height: 1 + (((bytes[24] & 0x0f) << 10) | (bytes[22] >> 6) | (bytes[23] << 2)) };
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset++; continue; }
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
      if (length < 2) break;
      offset += length + 2;
    }
  }
  return {};
}

function makeCatalogEntry(relative, bytes, sourceUrl, route) {
  const extension = path.extname(relative).toLowerCase();
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const name = path.basename(relative, extension).replace(/[-_]+/g, ' ');
  return {
    id: `asset.owner-native.${slug(relative)}`,
    name,
    kind: 'image',
    category: 'content',
    source: relative,
    extension: extension.slice(1),
    bytes: bytes.length,
    sha256,
    referenceSha256: sha256,
    referenceSource: relative,
    provenance: { method: 'owner-native-html-source', sourceUrl },
    ...inspectImage(bytes, extension),
    renderTargets: [`website:${route}`],
    replaceable: true,
    tags: ['owner-native-conversion', `route:${route}`],
  };
}

async function verifyRuntimeCodeResources(projectRoot, referenceDist, routes) {
  const referenceRoot = await realpath(path.resolve(projectRoot, referenceDist));
  const resources = new Map();
  for (const rule of RUNTIME_EXCEPTIONS) if (routes.has(rule.route)) {
    for (const resource of rule.policy.codeResources) resources.set(resource.source, resource);
  }
  for (const resource of resources.values()) {
    const candidate = path.resolve(referenceRoot, resource.source);
    const relative = path.relative(referenceRoot, candidate);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Runtime code resource escapes reference distribution: ${resource.url}`);
    const resolved = await realpath(candidate);
    const resolvedRelative = path.relative(referenceRoot, resolved);
    if (resolvedRelative.startsWith('..') || path.isAbsolute(resolvedRelative)) throw new Error(`Runtime code resource symlink escapes reference distribution: ${resource.url}`);
    const digest = createHash('sha256').update(await readFile(resolved)).digest('hex');
    if (digest !== resource.sha256) throw new Error(`Runtime code resource digest changed for ${resource.url}; requalify its frozen runtime policy before conversion`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = await realpath(args.project);
  const studioRoot = await realpath(args.studio);
  const manifestPath = path.join(projectRoot, 'project.json');
  const mutationsUrl = pathToFileURL(path.join(studioRoot, 'packages', 'project-kernel', 'src', 'mutations.ts')).href;
  const historyUrl = pathToFileURL(path.join(studioRoot, 'packages', 'editor-state', 'src', 'persistent-history.ts')).href;
  const mutations = await import(mutationsUrl);
  const { transact } = await import(historyUrl);
  const { validateOwnerProps } = await import(pathToFileURL(path.join(studioRoot, 'packages', 'owner-authoring', 'src', 'index.ts')).href);
  const ownerTags = new Set([...SEMANTIC_TAGS].filter((tag) => validateOwnerProps({ authoringVersion: 1, tag, attributes: {} }).valid));
  const { readAssetCatalogWithRevision, writeAssetCatalogWithRevision, readPageWithRevision, writePageWithRevision } = mutations;
  if (![readAssetCatalogWithRevision, writeAssetCatalogWithRevision, readPageWithRevision, writePageWithRevision, transact].every((fn) => typeof fn === 'function')) {
    throw new Error('Studio source is missing one or more required revision/history exports');
  }
  const project = JSON.parse(await readFile(manifestPath, 'utf8'));
  const catalogPath = path.join(projectRoot, project.assetCatalog ?? 'assets/index.json');
  const pageIndex = JSON.parse(await readFile(path.join(projectRoot, project.pageIndex ?? 'pages/index.json'), 'utf8'));
  let selectedEntries;
  if (args.allPages) selectedEntries = pageIndex.pages;
  else {
    const pagePath = await realpath(args.page);
    const pageRelative = path.relative(projectRoot, pagePath);
    if (pageRelative.startsWith('..') || path.isAbsolute(pageRelative)) throw new Error('--page must resolve inside the project');
    selectedEntries = pageIndex.pages.filter((entry) => path.resolve(projectRoot, entry.file) === pagePath);
    if (selectedEntries.length !== 1) throw new Error('--page must resolve to exactly one registered project page');
  }
  if (!selectedEntries.length) throw new Error('The selected scope contains no registered pages');
  await verifyRuntimeCodeResources(projectRoot, project.referenceDist ?? 'reference', new Set(selectedEntries.map((entry) => entry.route)));
  const initialCatalog = readAssetCatalogWithRevision(manifestPath);
  const initialPages = selectedEntries.map((entry) => ({ entry, snapshot: readPageWithRevision(manifestPath, entry.id) }));

  const catalog = structuredClone(initialCatalog.value);
  const assetOptions = { referenceDist: project.referenceDist ?? 'reference' };
  const additions = new Map();
  const assetIdsByUrl = new Map();
  const resolveInCatalog = (url, context = {}) => {
    const options = { ...assetOptions, route: context.route ?? '/' };
    const found = catalogAssetForUrl(catalog, url, options);
    if (found) { assetIdsByUrl.set(url, found.id); return found.id; }
    const relative = referenceSourceForUrl(url, options);
    if (!relative) return null;
    const absolute = path.resolve(projectRoot, relative);
    const rel = path.relative(projectRoot, absolute);
    if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Image path escapes project: ${url}`);
    additions.set(url, { relative: relative.replaceAll('\\', '/'), absolute, route: options.route });
    return `pending-${slug(url)}`;
  };
  const runtimeExceptions = RUNTIME_EXCEPTIONS;
  const convertedPages = new Map();
  for (const { snapshot } of initialPages) {
    const page = snapshot.value;
    assetOptions.route = page.route;
    convertedPages.set(page.id, convertPage(page, { assetForUrl: resolveInCatalog, ownerTags, runtimeExceptions, referenceDist: assetOptions.referenceDist }));
  }
  // Finish all asynchronous image reads before entering Studio's synchronous history transaction.
  for (const [url, item] of additions) {
    const resolvedFile = await realpath(item.absolute);
    const resolvedRelative = path.relative(projectRoot, resolvedFile);
    if (resolvedRelative.startsWith('..') || path.isAbsolute(resolvedRelative)) throw new Error(`Image symlink escapes project: ${url}`);
    if (!/\.(?:png|jpe?g|webp|gif|avif)$/i.test(item.relative)) throw new Error(`Missing local asset requires an approved image format: ${url}`);
    const bytes = await readFile(resolvedFile);
    const entry = makeCatalogEntry(item.relative, bytes, url, item.route);
    const duplicate = catalog.assets.find((candidate) => candidate.sha256 === entry.sha256);
    if (duplicate) { assetIdsByUrl.set(url, duplicate.id); continue; }
    if (catalog.assets.some((candidate) => candidate.id === entry.id)) entry.id += `.${entry.sha256.slice(0, 8)}`;
    catalog.assets.push(entry);
    assetIdsByUrl.set(url, entry.id);
  }
  const freshCatalog = readAssetCatalogWithRevision(manifestPath);
  const freshPages = initialPages.map(({ entry }) => ({ entry, snapshot: readPageWithRevision(manifestPath, entry.id) }));
  if (freshCatalog.revision !== initialCatalog.revision || freshPages.some((item, index) => item.snapshot.revision !== initialPages[index].snapshot.revision)) throw new Error('Project changed during dry conversion; no writes were made. Rerun against the latest revisions.');
  for (const { snapshot } of freshPages) {
    const page = snapshot.value;
    assetOptions.route = page.route;
    convertedPages.set(page.id, convertPage(page, { assetForUrl: (url, context = {}) => assetIdsByUrl.get(url) ?? catalogAssetForUrl(catalog, url, { route: context.route ?? page.route, referenceDist: assetOptions.referenceDist })?.id ?? null, ownerTags, runtimeExceptions, referenceDist: assetOptions.referenceDist }));
  }
  const validate = (items) => { for (const component of items ?? []) {
    const result = validateOwnerProps(component.props);
    if (!result.valid) throw new Error(`Invalid owner props on ${component.id}: ${result.errors.join('; ')}`);
    validate(component.props?.children);
  } };
  for (const converted of convertedPages.values()) validate(converted.components);
  const {loadProject}=await import(pathToFileURL(path.join(studioRoot,'packages/project-kernel/src/loader.ts')).href);
  const {validateProject}=await import(pathToFileURL(path.join(studioRoot,'packages/project-kernel/src/validate.ts')).href);
  const originalBundle=loadProject(manifestPath),candidate={...originalBundle,assets:catalog,pages:originalBundle.pages.map(page=>convertedPages.get(page.id)??page)};
  const candidateValidation=validateProject(candidate);
  if(!candidateValidation.valid)throw new Error('Converted project fails validation before writing: '+JSON.stringify(candidateValidation.errors));
  const writeResult = transact(manifestPath, `Convert ${args.allPages ? 'all selected pages' : selectedEntries[0].route} to native authoring`, () => {
    const catalogWrite = additions.size
      ? writeAssetCatalogWithRevision(manifestPath, catalog, freshCatalog.revision)
      : freshCatalog;
    const pageRevisions = {};
    for (const { entry, snapshot } of freshPages) pageRevisions[entry.id] = writePageWithRevision(manifestPath, entry.id, convertedPages.get(entry.id), snapshot.revision).revision;
    return { catalogRevision: catalogWrite.revision, pageRevisions };
  });
  console.log(JSON.stringify({ scope: args.allPages ? 'all-pages' : 'selected-page', pages: selectedEntries.map((entry) => entry.file), catalog: catalogPath, stagedAssets: additions.size, writeResult }, null, 2));
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(`convert-owner-native: ${error.message}`);
    process.exitCode = 1;
  });
}
