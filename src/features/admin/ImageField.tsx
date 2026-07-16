import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, UploadCloud } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { supabase } from "../../lib/supabase/client";
import { tx } from "../../utils/i18n";
import type { LocalizedText } from "../../types";
import { ImageCropModal } from "./ImageCropModal";

/* Reusable "add a picture" control: either upload a file straight to the
   public Storage bucket (and get a public URL back) or paste an existing
   URL. Shows a live preview and offers a crop step before uploading. Used by
   every admin screen that attaches media, so editors never have to think
   about buckets or paths. */

const PUBLIC_BUCKET = "public-assets";

export function ImageField({
  label,
  value,
  onChange,
  aspect = null
}: {
  label?: LocalizedText;
  value: string;
  onChange: (url: string) => void;
  /* Optional crop aspect lock (e.g. 1 for avatars, 16/9 for banners). */
  aspect?: number | null;
}) {
  const { t, notify } = usePortal();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const upload = async (file: Blob, name = "image.jpg") => {
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      notify(t(tx("اختر ملف صورة صالحًا.", "Choose a valid image file.")), "error");
      return;
    }
    setUploading(true);
    const safeName = name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const objectPath = `images/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false
    });
    if (error) {
      setUploading(false);
      notify(error.message, "error");
      return;
    }
    const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(objectPath);
    setUploading(false);
    onChange(data.publicUrl);
    notify(t(tx("تم رفع الصورة.", "Image uploaded.")), "success");
  };

  return (
    <div className="image-field field-wide">
      <span className="image-field-label">
        <ImagePlus size={15} />
        {t(label ?? tx("الصورة", "Image"))}
      </span>

      <div className="image-field-body">
        <div className="image-field-preview" aria-hidden={value ? undefined : true}>
          {value ? (
            <img src={value} alt="" />
          ) : (
            <span className="image-field-placeholder">
              <ImagePlus size={22} />
            </span>
          )}
        </div>

        <div className="image-field-controls">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="spin" size={16} /> : <UploadCloud size={16} />}
            {t(tx("رفع صورة", "Upload image"))}
          </button>
          {value ? (
            <button type="button" className="btn btn-ghost" onClick={() => onChange("")}>
              <Trash2 size={16} />
              {t(tx("إزالة", "Remove"))}
            </button>
          ) : null}
          <label className="image-field-url">
            <Link2 size={14} />
            <input
              type="url"
              dir="ltr"
              placeholder={t(tx("أو الصق رابط صورة", "or paste an image URL"))}
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
          </label>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              if (file.type.startsWith("image/")) setCropFile(file);
              else notify(t(tx("اختر ملف صورة صالحًا.", "Choose a valid image file.")), "error");
            }
            event.target.value = "";
          }}
        />
      </div>

      {cropFile ? (
        <ImageCropModal
          file={cropFile}
          defaultAspect={aspect}
          onCancel={() => setCropFile(null)}
          onUseOriginal={() => {
            const f = cropFile;
            setCropFile(null);
            upload(f, f.name);
          }}
          onCropped={(blob) => {
            const ext = blob.type === "image/png" ? "png" : "jpg";
            const base = cropFile.name.replace(/\.[^.]+$/, "");
            setCropFile(null);
            upload(blob, `${base}-cropped.${ext}`);
          }}
        />
      ) : null}
    </div>
  );
}
