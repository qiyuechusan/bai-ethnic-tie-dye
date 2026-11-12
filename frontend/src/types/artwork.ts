export interface Artwork {
  id: number
  title: string
  imageUrl: string
  description?: string | null
  tieMethod: string
  authorName: string
  status: number
  likes: number
  createdAt: string
}

export interface ArtworkUploadPayload {
  file: File
  title: string
  authorName: string
  description: string
  tieMethod: string
}

export interface ArtworkLikeResult {
  id: number
  likes: number
}
