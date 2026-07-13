import JSZip from "jszip";

export interface ZipEntry {
  filename: string;
  blob: Blob;
}

export async function downloadAsZip(entries: ZipEntry[], zipName = "meesho-product-variants.zip") {
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.filename, entry.blob);
  }
  const content = await zip.generateAsync({ type: "blob" });
  triggerDownload(content, zipName);
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
