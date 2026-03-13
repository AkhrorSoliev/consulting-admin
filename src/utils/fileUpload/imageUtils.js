// Convert an image File to a high-quality Base64 data URL.
export async function imageFileToBase64(
  file,
  {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.9,
    mimeType = "image/jpeg",
  } = {},
) {
  if (!(file instanceof File)) {
    throw new Error("imageFileToBase64: file must be a File");
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  let targetWidth = img.width;
  let targetHeight = img.height;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const widthRatio = maxWidth / targetWidth;
    const heightRatio = maxHeight / targetHeight;
    const scale = Math.min(widthRatio, heightRatio);
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");

  if (ctx.imageSmoothingEnabled !== undefined) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const result = canvas.toDataURL(mimeType, quality);
  return result;
}
