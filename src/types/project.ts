export interface Project {
  id: string;
  name: string;
  description: string;
  imageCount: number;
  createdAt: Date;
  updatedAt: Date;
  imagePairs?: ImagePair[];
  images?: Array<string>;
}

export interface ImagePair {
  id: string;
  projectId: string;
  visibleImage: Image;
  infraredImage: Image;
}

export interface Image {
  id: string;
  url: string;
  name: string;
  type: "visible" | "infrared";
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  bbox: number[]; // [x, y, width, height]
  label: string;
  confidence?: number;
  color?: string;
  imageId?: string;
}

export interface AutoAnnotateResult {
  annotations: Annotation[];
  error?: string;
}
