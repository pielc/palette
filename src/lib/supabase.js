import { createClient } from "@supabase/supabase-js";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
} from "$env/static/public";

const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);

export async function loadImageAndLabels(bucket, imagePath, labelsPath) {
  const { data: imgUrl } = await supabase.storage
    .from(bucket)
    .getPublicUrl(imagePath);

  const { data: lblUrl } = await supabase.storage
    .from(bucket)
    .getPublicUrl(labelsPath);

  console.log(imgUrl);
  console.log(lblUrl);
  const img = await loadImage(imgUrl.publicUrl);

  const lblRes = await fetch(lblUrl.publicUrl);
  const lblBuf = await lblRes.arrayBuffer();
  const lblArray = new Uint8Array(lblBuf);
  console.log(lblArray);

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = img.width;
  tmpCanvas.height = img.height;
  const tmpCtx = tmpCanvas.getContext("2d");
  tmpCtx.drawImage(img, 0, 0);
  const imgData = tmpCtx.getImageData(0, 0, img.width, img.height);

  const lblRGBA = new Uint8Array(img.width * img.height * 4);
  for (let i = 0; i < lblArray.length; i++) {
    lblRGBA[i * 4] = lblArray[i];
    lblRGBA[i * 4 + 1] = 0;
    lblRGBA[i * 4 + 2] = 0;
    lblRGBA[i * 4 + 3] = 255;
  }

  return {
    image: imgData.data,
    labels: lblRGBA,
    width: img.width,
    height: img.height,
  };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export async function loadPalette() {
  const { data: paletteData, error } = await supabase
    .from("ImageColors")
    .select()
    .eq("image_id", "test");

  let res = paletteData.pop().palette;
  console.log(res);
  return res;
}
