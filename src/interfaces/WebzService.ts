export interface WebzServiceCallback {
    (retrievedCount: number, totalCount: number): void;
  }
  
  export interface WebzService {
    fetchPosts(query: string, callback: WebzServiceCallback): Promise<void>;
  }