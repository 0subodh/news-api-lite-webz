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
  private readonly requestDelayMs: number = 1000; // 1 second delay between requests

  constructor(token: string, baseUrl: string, postRepository: PostRepository) {
    this.token = token;
    this.baseUrl = baseUrl;
    this.postRepository = postRepository;
  }

  /**
   * Fetch posts from the Webz.io API recursively until all available posts are retrieved
   * or the maximum number of posts is reached.
   *
   * @param query The search query to use
   * @param callback Callback function to be called with the counts
   */
  async fetchPosts(query: string, callback: WebzServiceCallback): Promise<void> {
    try {
      // Ensure database tables exist
      await this.postRepository.createTablesIfNotExist();

      // Initialize the query builder with the initial search parameters
      const queryBuilder = new WebzQueryBuilder(this.token, this.baseUrl)
        .withQuery(query)
        .withSize(10)
        .withHighlight(true);

      let initialUrl = queryBuilder.build();

      // Start the recursive fetching process
      const { retrievedCount, totalCount } = await this.fetchAndSaveRecursively(initialUrl);

      // Call the callback with the final counts
      callback(retrievedCount, totalCount);
    } catch (error) {
      logger.error('Error fetching posts from Webz.io API', error);
      throw error;
    }
  }

  /**
   * Recursively fetch and save posts from the Webz.io API
   */
  private async fetchAndSaveRecursively(
    url: string,
    totalRetrieved: number = 0
  ): Promise<{ retrievedCount: number; totalCount: number }> {
    try {
      logger.info(`Fetching posts from: ${url}`);

      // Make the API request
      const response = await axios.get<WebzResponse>(url);
      const data = response.data;

      logger.info(`Received ${data.posts.length} posts. More available: ${data.moreResultsAvailable}`);

      // Save the posts to the database
      if (data.posts.length > 0) {
        const savedCount = await this.postRepository.savePosts(data.posts);
        logger.info(`Saved ${savedCount} posts to the database`);
        totalRetrieved += savedCount;
      }

      // Check if there are more results and we should continue
      if (data.moreResultsAvailable > 0 && data.next) {
        // Use the next URL provided by the API for pagination
        const nextUrl = new URL(data.next, this.baseUrl).toString();

        logger.info(`Retrieved ${totalRetrieved} posts so far. Continuing to next page...`);

        // Add delay before the next recursive call
        await new Promise((resolve) => setTimeout(resolve, this.requestDelayMs));

        // Recursively fetch the next batch
        return this.fetchAndSaveRecursively(nextUrl, totalRetrieved);
      }

      // No more results or we've reached the desired count
      logger.info(`Finished retrieving posts. Total retrieved: ${totalRetrieved}`);
      return { retrievedCount: totalRetrieved, totalCount: data.totalResults };
    } catch (error) {
      logger.error('Error during recursive fetch and save', error);

      // If we've already retrieved some posts, return those counts
      if (totalRetrieved > 0) {
        return { retrievedCount: totalRetrieved, totalCount: totalRetrieved };
      }

      // Otherwise, rethrow the error
      throw error;
    }
  }
}