import { createClient } from "@supabase/supabase-js";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
} from "$env/static/public";

const BUCKET_NAME = "labels";

const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);

export async function loadImageAndLabels(imageId) {
  const { data: imgUrl } = await supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`${imageId}${imageId == "test" ? ".png" : ".jpg"}`);

  const { data: lblUrl } = await supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`${imageId}.bin`);

  console.log(imgUrl);

  const img = await loadImage(imgUrl.publicUrl);

  const lblRes = await fetch(lblUrl.publicUrl);
  const lblBuf = await lblRes.arrayBuffer();
  const lblArray = new Uint8Array(lblBuf);

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

export async function loadTestPalette() {
  const { data: paletteData, error } = await supabase
    .from("ImageColors")
    .select()
    .eq("image_id", "test");

  let res = paletteData.pop();

  return {
    labelColors: res.palette,
    artInfo: res.art_info,
    imageId: res.imageId,
  };
}

export async function loadPalette() {
  const { data: paletteData, error } = await supabase
    .from("ImageColors")
    .select()
    .eq("display_month", new Date().getMonth() + 1)
    .eq("display_day", new Date().getDate());

  let res = paletteData.pop();

  return res
    ? {
        labelColors: res.palette,
        artInfo: res.art_info,
        imageId: res.image_id,
      }
    : null;
}
