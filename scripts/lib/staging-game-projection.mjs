// A bounded exclusion from the public staging export, never cartridge admission.
// The frozen candidate and Studio reference retain all original CLAW bytes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isProtectedGameArtifact } from './protected-game-artifacts.mjs';

export const CLAW_CUSTODY_SOURCE = '72c8f76686a9479f593aea36c1dc20f116706b98';
// Frozen candidate paths, lengths and hashes. Never regenerate from a new candidate
// to make a failed export pass. A changed or additional cartridge is refused.
export const CLAW_QUARANTINE_FILES = Object.freeze([
  {
    "path": "public/games/claw-feed-gulper/README.md",
    "bytes": 1603,
    "sha256": "d575c031b322b3d334ba30577be412ed43959eb37384bccbbd9889f2bd3ca253"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/audio/crumb.wav",
    "bytes": 7100,
    "sha256": "2005633f4756b620bea744bbd43d8ed4895c2689d73e4e6d4446b55244a63164"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/audio/juice.wav",
    "bytes": 7982,
    "sha256": "10c2eeb68b46ea0f016775f398a2f3b87740e2050b7cba3ddc47ac542eb3e5fb"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/audio/premium.wav",
    "bytes": 11510,
    "sha256": "b2973a52460272f14e16026cdc050fc87ee4f72b14e9da441bf1ad8f2f0092c3"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/audio/rice.wav",
    "bytes": 6658,
    "sha256": "ab07cba28a37fe36ae5d987c606d3b1bca9bc46f6eeb26c8e1436deffed995e8"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/audio/savory.wav",
    "bytes": 8422,
    "sha256": "43fdfbe3ab6114e6dcbf80a05e7737581cf9bc78a3ad434837bbfd448e13197c"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/audio/sugar.wav",
    "bytes": 7100,
    "sha256": "2496e3604489bc8c2acfa12fa1b3fb357ac575f48de89d20d8f65a7ba6b7e1b2"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/blueberry.png",
    "bytes": 72532,
    "sha256": "f1ffd366a9d99b1693c1d0b3b654fdc19c8c3eacd0f5d5295f627d9be84cffb0"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/burger.png",
    "bytes": 75779,
    "sha256": "11afe94515738355834d875f8584a4a56aaa927839309e0f9ab0b30ec8a9eaac"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/candy_corn.png",
    "bytes": 62127,
    "sha256": "00a7a5a8a0a0fabd3553344dff3477451740fe37cd6815996b3a84678f5a9a1b"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/cookie.png",
    "bytes": 83849,
    "sha256": "c5e4473e8646484d69290feb2c04c470ddefd1c24ed6ad128b0a4d5dec134870"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/cupcake.png",
    "bytes": 60507,
    "sha256": "5c2680b3d769024fe08e8c5a98a101c1c1f8b4c3aa9b24dd1dbf74c9f7548cb4"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/fries.png",
    "bytes": 69051,
    "sha256": "27761c2f94507dce84152c4ad208594a42917c2aaf539396b9e7612abec5dd91"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/grapes.png",
    "bytes": 64070,
    "sha256": "f6143d5d5b8637f3b43de879b6e804af2d2b571f9e13bf63a67245874d1406a4"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/gummy_bears.png",
    "bytes": 45477,
    "sha256": "bc4b422300ddea486a0282932aa3602e6b13f1d9c5acaceb1d8ba3142ddb6bda"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/lemon.png",
    "bytes": 63152,
    "sha256": "f50fda604ca36c94203d1b050aaa102557170ba53177612d29dbcb51154fd3b3"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/mango.png",
    "bytes": 58559,
    "sha256": "966e7a7cec1efc563a7c12da90db62c391c08fad1fceb63b96b17fcdeda7899b"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/orange.png",
    "bytes": 75665,
    "sha256": "c80f6e14bb8a184dc35fcc999011c611676b671a8ab95d207e1719e47bcfe3d3"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/pear.png",
    "bytes": 60858,
    "sha256": "61365bb24be4dd62a6e5ba9b1cdcc2d8f7f6c999b0bab3c4cf452be160825a89"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/pineapple_wedge.png",
    "bytes": 61846,
    "sha256": "1a62f7cb9da6260a7816ccb05768cdd662386eb5b35b392881426f2cc8036098"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/pizza.png",
    "bytes": 64267,
    "sha256": "03dd462eecbe8176eedb30dcc4bf7c0d4c52330906aab64f25addba3ae25af00"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/pretzel.png",
    "bytes": 73577,
    "sha256": "f1479988523a38578c255e34a827e6b4ad15835ad5825aa2333ae43c02a714d2"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/salmon_steak.png",
    "bytes": 59145,
    "sha256": "60721fbffbad9a3670dfe6ad8b46a6fce767823836aa11b1f393e97896b6e72f"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/shrimp_skewer.png",
    "bytes": 54011,
    "sha256": "6026476e466cafd76d21bf144a3e0177488adf5319d5d242d834a3c9a2450652"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/strawberry.png",
    "bytes": 53923,
    "sha256": "f0e48b599e7cc347467d284b19c8290b29e86c795bbf098c5ab2447e09947f7c"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/watermelon.png",
    "bytes": 60729,
    "sha256": "eb7ba27fd866aa3e7a98ed6ac10f12e02f418a3c26f79161737ea46acfd7fc45"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/foods/wrapped_candy_mix.png",
    "bytes": 36718,
    "sha256": "a93bc2f9ae4bf1c5db43a21e240676801effc677ee7ea454d107b32da3df76b2"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/feeding/gulper_stage_0_eat_8f_450.png",
    "bytes": 1206114,
    "sha256": "237fcf791ea4bd9e3917e08c35d562a12ceacf19731b83f7d9d43f5a1e8e32b5"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/feeding/gulper_stage_1_eat_8f_450.png",
    "bytes": 1245364,
    "sha256": "ed55daf184badebe19734d673c0fe84c4a463c33bc0e70a5b2fe9239f88c1fad"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/feeding/gulper_stage_2_eat_8f_450.png",
    "bytes": 1283361,
    "sha256": "675a73f5cdeb5307666dbac0001da84353abc26d302fb139d6fa0ad23bc68fe0"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/feeding/gulper_stage_3_eat_8f_450.png",
    "bytes": 1324471,
    "sha256": "4db84cfe972be11db32304ff97e8655dc15322349ba5d8bb3d3eeccbefc44e07"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/feeding/gulper_stage_4_eat_8f_450.png",
    "bytes": 1365554,
    "sha256": "a9b056f43eea17284d3a78e1160ac658f079172daa614dcaedb0b72bf6441bf6"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/feeding/gulper_stage_5_eat_8f_450.png",
    "bytes": 1405815,
    "sha256": "ecef7931ebd3e03f015fd835527d9e63588109b1dba0d757543fa4d7ef1248f2"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/feeding/gulper_stage_6_eat_8f_450.png",
    "bytes": 1444500,
    "sha256": "1fcf46cc0a0b27f5506f3b53e516283b90a97197c00c25e805fc1fc3eaeb491d"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/feeding/gulper_stage_7_eat_8f_450.png",
    "bytes": 1483201,
    "sha256": "501be0f0df0b85472db82ef4e88aaae0d8cc80ab6fcd0be03eae45126e14f3ac"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_0.png",
    "bytes": 150749,
    "sha256": "3e46d97e887381fe32353d5e7ce65d6fb7ad845e0daee1093cd814c2dd6d7041"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_0_blink.png",
    "bytes": 146779,
    "sha256": "b098383874616265dded68f42ad3eab212cfc73b9a8b2ae4acca19565d5d1200"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_1.png",
    "bytes": 154926,
    "sha256": "b909fad227b34ea2d6b0dfe5a8957e5f6481156d2cb80847f6999bac8a5cd04e"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_1_blink.png",
    "bytes": 151176,
    "sha256": "3b00dfe88bd7b9f234815ed6ed44984fb57a9fd42b89781413129d2bac780d87"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_2.png",
    "bytes": 159883,
    "sha256": "9cc1adde4803d1d464c24a4ccdee4c454a9697269157c6705bd69c6167c27ca4"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_2_blink.png",
    "bytes": 155852,
    "sha256": "2ea010cc5c27f467dff0ca0ab8b6a99bae4c176f9fe746d20521cee9d1264fab"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_3.png",
    "bytes": 165016,
    "sha256": "d8d754d9a2b075519cd7e529c7456b7918879a25fe269188309b8f447425d64b"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_3_blink.png",
    "bytes": 160265,
    "sha256": "de06ac07461e334c13c108cbe85ceebb879a80b6072a7f8942a37b51b8fa5d2b"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_4.png",
    "bytes": 170336,
    "sha256": "04605ce960152d1a26dd1b58a393dfd61b1d7a4eb9742eb334db303ebf29bc70"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_4_blink.png",
    "bytes": 165552,
    "sha256": "2db3eddc9a814f5caa3f18eb00429130ec34cc5cab3dbbe11262588eeabccc6c"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_4_blink_open.png",
    "bytes": 171289,
    "sha256": "bfa6a3715a10375532cd4b0db031644012fb93e9877de4a1b1698538966aa1c2"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_5.png",
    "bytes": 175140,
    "sha256": "16da8563ea4684a153b1c468025196a2bfc8a3f5e64caca8c8815f065082caac"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_5_blink.png",
    "bytes": 170203,
    "sha256": "d5e71d8449e727aed7e82ffc2d340aafe1c7ce8785aad727c20c955407ae784c"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_5_blink_open.png",
    "bytes": 176268,
    "sha256": "a9858d33e5b90f40145911c983082acaa8d542c5664d57f7214e703b7a9a3810"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_6.png",
    "bytes": 179898,
    "sha256": "2eb25bc3cb7d682e1ff04522e7899e0c5352c75ccb43bb0c2252a44bdccd4641"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_6_blink.png",
    "bytes": 174932,
    "sha256": "efe5beffc0ab685a0bac914fea8681ff21894a5d2fd2467ee7c2558f65d83991"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_6_blink_open.png",
    "bytes": 181206,
    "sha256": "3c39cfbd553b097e5d320fa2ba0f4750236d1109139198a03e9c5ee3702396b5"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_7.png",
    "bytes": 184866,
    "sha256": "5e8a1b518be3123128b0a774f92c28015e883d1a3a44eec7d2c33cf9384d71a7"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_7_blink.png",
    "bytes": 179707,
    "sha256": "d29f68abd6be3c989d859ff470b97ad4c8fcddc8ad3405da51164b54ce90cbe6"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/gulper/stages/gulper_stage_7_blink_open.png",
    "bytes": 186336,
    "sha256": "adc6bb0be63a26830ab1655c581ccf78207aa956170f0dafa95e8fe395f4f32b"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/specials/bomb.png",
    "bytes": 69496,
    "sha256": "e343b529fbd00a06d267afe17c9907ebc8b6e5610b218eca9474e2a6bb1c7972"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/specials/heart.png",
    "bytes": 91347,
    "sha256": "ce3471e8e838ccbbac0bde165234d047a4a94bd86cdb9a9140910a547163feb0"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/specials/magnet.png",
    "bytes": 72867,
    "sha256": "12422d1078cc575c9cc84ced7322d814ca797743f541097254d8fca2cac89c5b"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/specials/royal.png",
    "bytes": 60386,
    "sha256": "423b4317d22bd78fe7f6b475ac6ef0c4547b01a09a7f3a4a435f1aa0c220a10f"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/specials/shield.png",
    "bytes": 56420,
    "sha256": "ed435511560c1a83ff886997e7d311fddea6c100913de7bd25097bc6ef61f22d"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/specials/syringe.png",
    "bytes": 37133,
    "sha256": "bdb24ce05c162499a84f142db0601c5f496e0c4bd3364e530fbc450d1d6170d5"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/specials/time.png",
    "bytes": 61476,
    "sha256": "25d69a1c07ef489d053793f9d71fb05ebc25cb74971f0bd5b8b5200653ea28f6"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/app-icon-180.png",
    "bytes": 17152,
    "sha256": "3a48cb988dfaa06ad051e181b037ba58b5b6cb8fb782be0f8233c11899b6b70c"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/app-icon-192.png",
    "bytes": 19035,
    "sha256": "142dcccca903f3703ad8c5b42e5cb34f7b81c1396ff755b9470c5507f98d4904"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/app-icon-512.png",
    "bytes": 100369,
    "sha256": "bcdf5cb1f4c1fb51ffab1573621b3ab04c76681bcb233f3c31e4eb177994201b"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/background.webp",
    "bytes": 189272,
    "sha256": "a3e4105d6b5d7c5e2ceae49faaa8e10423b0d2c0b3f9e75a63a61fd3356dc15d"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/icon-back.png",
    "bytes": 16283,
    "sha256": "7676e0b0d20f9d24c5a4a24dcf8eb337ac9ae11e861583bd646a5f747b0e0c19"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/icon-help.png",
    "bytes": 10809,
    "sha256": "1c3f9d04b0aeb9b190122602a8bae6a7dd8b3c6c559a21c473bcb23b66722b41"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/icon-home.png",
    "bytes": 11240,
    "sha256": "753c4ec9ee2971b3daf0fb3e52e60c5fbbf7311605561590efbaba9deaf774dc"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/icon-pause.png",
    "bytes": 11680,
    "sha256": "440e847739313923bd156e722c90de9715b7fe42fa321c79340e14aff221e676"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/icon-resume.png",
    "bytes": 12136,
    "sha256": "6619fccdaeb9c73526438924bcfc40547bf61a86da66efae7712823142dddaae"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/icon-settings.png",
    "bytes": 9512,
    "sha256": "b1f31dd92a0677b10e63f8c89a2e9fec5a1c168469ad42ed507906289b62198b"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/star-empty.png",
    "bytes": 74579,
    "sha256": "9b7037e5c890bb5a10f5d1049d8f2ba352ed9f5cafbc43d908fb129c8730cbcf"
  },
  {
    "path": "public/games/claw-feed-gulper/assets/ui/star-fill.png",
    "bytes": 86294,
    "sha256": "8d31aa1507c05232ec43d864fc08324b71003dd5fc243df786e2a75ba851c00e"
  },
  {
    "path": "public/games/claw-feed-gulper/card-authority.json",
    "bytes": 1118,
    "sha256": "e78a4c478fd0cbcd16a0ed7d1a31b51d58dc9f9935aafcb2896d3d1808e43e4d"
  },
  {
    "path": "public/games/claw-feed-gulper/cartridge.integrity.json",
    "bytes": 13776,
    "sha256": "eecb0c07f4a0b53cb772e8d77b39e1d9f653eb61e89846295fd97c92e0738e8d"
  },
  {
    "path": "public/games/claw-feed-gulper/cartridge.json",
    "bytes": 2434,
    "sha256": "8fa63230a8eafe1eaf06af5091bd16f4ddd572cff3538d07ae9827fb9ecf2ab6"
  },
  {
    "path": "public/games/claw-feed-gulper/index.html",
    "bytes": 16453,
    "sha256": "762afa5b995ea6cb06392a7a933773256885a989b88fc328a95cc94095656e16"
  },
  {
    "path": "public/games/claw-feed-gulper/poster.webp",
    "bytes": 189806,
    "sha256": "90ee7b8e2d405bc045a910ea83b1ecd5f125038401597e6c23c90efeba19ded8"
  },
  {
    "path": "public/games/claw-feed-gulper/runtime.bundle.js",
    "bytes": 156709,
    "sha256": "57ee3963e9dbc4d98ff514d403f44cf4280e330e578eec9c1f97920d20523d8e"
  },
  {
    "path": "public/games/claw-feed-gulper/screenshot.webp",
    "bytes": 34358,
    "sha256": "061ca7b47d399ca761b4013cefa6b76a5f202760152a373e4a5b472409058f96"
  },
  {
    "path": "public/games/claw-feed-gulper/styles.css",
    "bytes": 44699,
    "sha256": "0905a928725858499f9aedbf6ff28d7a0b07938ce82250d999bef608b4b07cfd"
  },
  {
    "path": "public/games/claw-feed-gulper/tcs1.json",
    "bytes": 945,
    "sha256": "39a2b42d49e73af2df3baf6baf961e4d9c1ad2ff5e9993fc0ac48de1a1ed5829"
  }
].map(row => Object.freeze(row)));
const fail = (ok, message) => { if (!ok) throw new Error(message); };
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function classifyStagingGameRows(rows, admittedFiles) {
  const quarantineFiles = CLAW_QUARANTINE_FILES;
  const protectedRows = rows.filter(row => isProtectedGameArtifact(row.path));
  const admitted = new Map(admittedFiles.map(row => [row.path, row]));
  const quarantine = new Map(quarantineFiles.map(row => [row.path, row]));
  fail(quarantine.size === quarantineFiles.length && quarantineFiles.every(row =>
    /^public\/games\/claw-feed-gulper\/[a-zA-Z0-9_./-]+$/.test(row.path) &&
    !row.path.split('/').some(part => !part || part === '.' || part === '..') &&
    Number.isSafeInteger(row.bytes) && row.bytes > 0 && /^[a-f0-9]{64}$/.test(row.sha256)),
    'Invalid fixed CLAW quarantine inventory');
  const selected = [], excluded = [], seen = new Set();
  for (const row of protectedRows) {
    fail(!seen.has(row.path), 'Duplicate protected payload: ' + row.path); seen.add(row.path);
    const pin = admitted.get(row.path) || quarantine.get(row.path);
    fail(pin, 'Unknown protected game payload; new admission is held: ' + row.path);
    fail(pin.bytes === row.bytes && pin.sha256 === row.sha256,
      'Protected game differs from fixed admission or quarantine identity: ' + row.path);
    (admitted.has(row.path) ? selected : excluded).push(row);
  }
  fail(selected.length === admitted.size, 'Missing preserved legacy staging game payload');
  fail(excluded.length === 0 || excluded.length === quarantine.size,
    'Incomplete fixed CLAW quarantine payload; no partial exclusion is allowed');
  return { admitted: selected, excluded };
}

export function projectStagingGamePayload(root, rows, admittedFiles) {
  const plan = classifyStagingGameRows(rows, admittedFiles);
  root = path.resolve(root);
  const quarantineRoot = path.join(root, 'public', 'games', 'claw-feed-gulper');
  // Check every excluded path and its bytes again before the first unlink.
  // No recursive removal, source mutation or arbitrary unknown-file filtering.
  for (const row of plan.excluded) {
    const file = path.resolve(root, ...row.path.split('/'));
    fail(file.startsWith(quarantineRoot + path.sep), 'Quarantine file escapes the fixed cartridge root');
    let current = file;
    while (true) {
      const stat = fs.lstatSync(current);
      fail(!stat.isSymbolicLink(), 'Linked quarantine path is refused: ' + row.path);
      if (current === file) fail(stat.isFile() && stat.nlink === 1, 'Nonregular quarantine file: ' + row.path);
      if (current === root) break;
      const parent = path.dirname(current); fail(parent !== current, 'Quarantine root is not an ancestor'); current = parent;
    }
    const bytes = fs.readFileSync(file);
    fail(bytes.length === row.bytes && hash(bytes) === row.sha256, 'Quarantine bytes changed before projection: ' + row.path);
  }
  for (const row of plan.excluded) fs.unlinkSync(path.join(root, ...row.path.split('/')));
  if (plan.excluded.length) {
    function prune(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        fail(entry.isDirectory() && !entry.isSymbolicLink(), 'Unexpected remaining quarantine entry');
        prune(path.join(directory, entry.name));
      }
      fs.rmdirSync(directory); // empty directories only
    }
    prune(quarantineRoot);
  }
  return { status: 'KNOWN_CLAW_EXCLUDED_FROM_PUBLIC_STAGING', sourceCommit: CLAW_CUSTODY_SOURCE,
    excludedFiles: plan.excluded.length, excludedBytes: plan.excluded.reduce((sum, row) => sum + row.bytes, 0),
    admittedGameFiles: plan.admitted.length, newCartridgeAdmission: 'NOT_ENABLED', sourceModified: false };
}
