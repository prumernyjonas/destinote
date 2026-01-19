/**
 * Utility funkce pro práci s obrázky v článcích
 */

export interface UploadedPhoto {
  url: string;
  public_id: string;
  width?: number;
  height?: number;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
}

/**
 * Nahraje soubory na Cloudinary
 */
export async function uploadImages(
  files: File[],
  token: string,
  userId?: string
): Promise<UploadedPhoto[]> {
  const uploadedPhotos: UploadedPhoto[] = [];

  for (const file of files) {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "destinote_articles");

    const uploadHeaders: Record<string, string> = {};
    if (token) {
      uploadHeaders["Authorization"] = `Bearer ${token}`;
    }
    if (userId) {
      uploadHeaders["x-user-id"] = userId;
    }

    const uploadRes = await fetch("/api/images/upload", {
      method: "POST",
      headers: uploadHeaders,
      credentials: "include",
      body: form,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text().catch(() => "");
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Upload failed with status ${uploadRes.status}` };
      }
      throw new Error(errorData.error || `Nahrání obrázku selhalo (${uploadRes.status})`);
    }

    const uploadData = await uploadRes.json();
    uploadedPhotos.push({
      url: uploadData.url,
      public_id: uploadData.public_id,
      width: uploadData.width,
      height: uploadData.height,
    });
  }

  return uploadedPhotos;
}

/**
 * Nastaví cover obrázek pro článek
 */
export async function setArticleCover(
  articleId: string,
  photo: UploadedPhoto | { url: string; alt: string | null },
  alt: string | null,
  token: string,
  userId?: string
): Promise<void> {
  const coverHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    coverHeaders["Authorization"] = `Bearer ${token}`;
  }
  if (userId) {
    coverHeaders["x-user-id"] = userId;
  }

  const isUploadedPhoto = "public_id" in photo;
  const coverRes = await fetch(`/api/articles/${encodeURIComponent(articleId)}/cover`, {
    method: "PUT",
    headers: coverHeaders,
    credentials: "include",
    body: JSON.stringify({
      url: photo.url,
      public_id: isUploadedPhoto ? photo.public_id : null,
      width: isUploadedPhoto ? photo.width || null : null,
      height: isUploadedPhoto ? photo.height || null : null,
      alt: alt || null,
    }),
  });

  if (!coverRes.ok) {
    const errorData = await coverRes.json().catch(() => ({}));
    throw new Error(errorData.error || "Nastavení hlavní fotografie selhalo");
  }
}

/**
 * Smaže cover obrázek článku
 */
export async function deleteArticleCover(
  articleId: string,
  token: string,
  userId?: string
): Promise<void> {
  const deleteHeaders: Record<string, string> = {};
  if (token) {
    deleteHeaders["Authorization"] = `Bearer ${token}`;
  }
  if (userId) {
    deleteHeaders["x-user-id"] = userId;
  }

  const deleteRes = await fetch(`/api/articles/${encodeURIComponent(articleId)}/cover`, {
    method: "DELETE",
    headers: deleteHeaders,
    credentials: "include",
  });

  if (!deleteRes.ok) {
    const errorText = await deleteRes.text().catch(() => "");
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText || `Delete failed with status ${deleteRes.status}` };
    }
    throw new Error(errorData.error || `Odstranění obrázku selhalo (${deleteRes.status})`);
  }
}

/**
 * Přidá obrázek do galerie článku
 */
export async function addPhotoToGallery(
  articleId: string,
  photo: UploadedPhoto,
  token: string,
  userId?: string
): Promise<void> {
  const photoHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    photoHeaders["Authorization"] = `Bearer ${token}`;
  }
  if (userId) {
    photoHeaders["x-user-id"] = userId;
  }

  const photoRes = await fetch(`/api/articles/${encodeURIComponent(articleId)}/photos`, {
    method: "POST",
    headers: photoHeaders,
    credentials: "include",
    body: JSON.stringify({
      url: photo.url,
      public_id: photo.public_id,
      width: photo.width || null,
      height: photo.height || null,
      alt: null,
    }),
  });

  if (!photoRes.ok) {
    console.warn(`Failed to add photo to gallery`);
  }
}

/**
 * Smaže obrázek z galerie článku
 */
export async function deletePhotoFromGallery(
  articleId: string,
  photoId: string,
  token: string,
  userId?: string
): Promise<void> {
  const deleteRes = await fetch(
    `/api/articles/${encodeURIComponent(articleId)}/photos/${photoId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(userId ? { "x-user-id": userId } : {}),
      },
    }
  );

  if (!deleteRes.ok) {
    const errorData = await deleteRes.json().catch(() => ({}));
    throw new Error(errorData.error || "Odstranění obrázku z galerie selhalo");
  }
}

/**
 * Načte galerii obrázků článku
 */
export async function getArticlePhotos(
  articleId: string,
  token?: string,
  userId?: string
): Promise<GalleryPhoto[]> {
  const photosHeaders: Record<string, string> = {};
  if (token) {
    photosHeaders["Authorization"] = `Bearer ${token}`;
  }
  if (userId) {
    photosHeaders["x-user-id"] = userId;
  }

  const photosRes = await fetch(`/api/articles/${encodeURIComponent(articleId)}/photos`, {
    method: "GET",
    headers: photosHeaders,
    credentials: "include",
  });

  if (photosRes.ok) {
    const photosData = await photosRes.json();
    return photosData.photos || [];
  }

  return [];
}
