// import { ImageAnnotatorClient } from "@google-cloud/vision";

// const vision = new ImageAnnotatorClient();

// function likelihoodToScore(v?: string) {
//   const order = ["UNKNOWN","VERY_UNLIKELY","UNLIKELY","POSSIBLE","LIKELY","VERY_LIKELY"];
//   return order.indexOf(v ?? "UNKNOWN");
// }

// export async function POST(req: Request) {
//   const form = await req.formData();
//   const files = (form.getAll("files") as File[]) || [];

//   const flagged: Array<{ name: string; adult?: string; racy?: string; violence?: string }> = [];

//   // Scan each image
//   for (const file of files) {
//     const buf = Buffer.from(await file.arrayBuffer());
//     const [res] = await vision.safeSearchDetection({ image: { content: buf } });
//     const s = res?.safeSearchAnnotation;

//     // Tunable thresholds (POSSIBLE=3, LIKELY=4, VERY_LIKELY=5)
//     const adult = likelihoodToScore(s?.adult);
//     const racy = likelihoodToScore(s?.racy);
//     const violence = likelihoodToScore(s?.violence);

//     if (adult >= 4 || racy >= 4 || violence >= 5) {
//       flagged.push({
//         name: file.name,
//         adult: s?.adult,
//         racy: s?.racy,
//         violence: s?.violence,
//       });
//     }
//   }

//   if (flagged.length) {
//     return new Response(
//       JSON.stringify({
//         error: "Explicit content detected",
//         details: flagged,
//       }),
//       { status: 400, headers: { "Content-Type": "application/json" } }
//     );
//   }
// }