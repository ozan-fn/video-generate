export interface GenerateRequest {
  prompt: string;
  images: {
    filename: string;
    originalName: string;
    size: number;
    path: string;
  }[];
}

export interface GenerateResponse {
  message: string;
  prompt: string;
  images: {
    filename: string;
    originalName: string;
    size: number;
    path: string;
  }[];
}
