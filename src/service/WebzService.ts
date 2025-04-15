import axios from 'axios';
import { WebzService as IWebzService, WebzServiceCallback } from '../interfaces/WebzService';
import { WebzResponse, Post } from '../interfaces/WebzResponse';
import { PostRepository } from '../interfaces/PostRepository';
import { WebzQueryBuilder } from '../builders/WebzQueryBuilder';
import logger from '../utils/logger';

export class WebzService implements IWebzService {
  private token: string;
  private baseUrl: string;
  private postRepository: PostRepository;
  private readonly requestDelayMs: number = 1000; 

  constructor(token: string, baseUrl: string, postRepository: PostRepository) {
    this.token = token;
    this.baseUrl = baseUrl;
    this.postRepository = postRepository;
  }

  async fetchPosts(query: string, callback: WebzServiceCallback): Promise<void> {
    try {
      await this.postRepository.createTablesIfNotExist();

      const queryBuilder = new WebzQueryBuilder(this.token, this.baseUrl)
        .withQuery(query)
        .withSize(10)
        .withHighlight(true);

      let initialUrl = queryBuilder.build();

      const { retrievedCount, totalCount } = await this.fetchAndSaveRecursively(initialUrl);

      callback(retrievedCount, totalCount);
    } catch (error) {
      logger.error('Error fetching posts from Webz.io API', error);
      throw error;
    }
  }
 
  private async fetchAndSaveRecursively(
    url: string,
    totalRetrieved: number = 0
  ): Promise<{ retrievedCount: number; totalCount: number }> {
    try {
      logger.info(`Fetching posts from: ${url}`);

      const response = await axios.get<WebzResponse>(url);
      const data = response.data;

      logger.info(`Received ${data.posts.length} posts. More available: ${data.moreResultsAvailable}`);

      if (data.posts.length > 0) {
        const savedCount = await this.postRepository.savePosts(data.posts);
        logger.info(`Saved ${savedCount} posts to the database`);
        totalRetrieved += savedCount;
      }

      if (data.moreResultsAvailable > 0 && data.next) {
        const nextUrl = new URL(data.next, this.baseUrl).toString();

        logger.info(`Retrieved ${totalRetrieved} posts so far. Continuing to next page...`);

        await new Promise((resolve) => setTimeout(resolve, this.requestDelayMs));

        return this.fetchAndSaveRecursively(nextUrl, totalRetrieved);
      }

      logger.info(`Finished retrieving posts. Total retrieved: ${totalRetrieved}`);
      return { retrievedCount: totalRetrieved, totalCount: data.totalResults };
    } catch (error) {
      logger.error('Error during recursive fetch and save', error);

      if (totalRetrieved > 0) {
        return { retrievedCount: totalRetrieved, totalCount: totalRetrieved };
      }

      throw error;
    }
  }
}