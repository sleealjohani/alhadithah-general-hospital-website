import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, UploadCloud } from "lucide-react";
import { usePortal } from "../../providers/PortalProvider";
import { supabase } from "../../lib/supabase/client";
import { tx } from "../../utils/i18n";
import type { LocalizedText } from "../../types";

/* Reusable "add a picture" control: either upload a file straight to the
   public Storage bucket (and get a public URL back) or paste an existing
   URL. Shows a live preview. Used by every admin screen that attaches
   media, so editors never have to think about buckets or paths. */

const PUBLIC_BUCKET = "public-assets";

export function ImageField({
  label,
  value,
  onChange
}: {
  label?: LocalizedText;
  value: string;
  onChange: (url: string) => void;
}) {
  const { t, notify } = usePortal();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (!supabase) {
      notify(t(tx("Supabase غير متصل.", "Supabase is not connected.")), "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      notify(t(tx("اختر ملف صورة صالحًا.", "Choose a valid image file.")), "error");
      return;
    }
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
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
            if (file) upload(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
