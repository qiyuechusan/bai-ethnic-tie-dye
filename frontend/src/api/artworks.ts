import { request } from './client'
import type { Artwork, ArtworkLikeResult, ArtworkUploadPayload } from '@/types/artwork'

export function listArtworks(): Promise<Artwork[]> {
  return request<Artwork[]>('/artworks')
}

export function uploadArtwork(payload: ArtworkUploadPayload): Promise<Artwork> {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('title', payload.title)
  formData.append('tieMethod', payload.tieMethod)
  formData.append('description', payload.description)
  formData.append('authorName', payload.authorName)
  return request<Artwork>('/artworks/upload', {
    method: 'POST',
    body: formData,
  })
}

export function likeArtwork(id: number): Promise<ArtworkLikeResult> {
  return request<ArtworkLikeResult>(`/artworks/${id}/like`, {
    method: 'POST',
  })
}
