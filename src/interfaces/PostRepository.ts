import { Post } from './WebzResponse';

export interface PostRepository {
  savePosts(posts: Post[]): Promise<number>;
  createTablesIfNotExist(): Promise<void>;
}