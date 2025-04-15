import dotenv from 'dotenv';
import { WebzService } from './services/WebzService';
import { PostRepository } from './repositories/PostRepository';
import dbPool from './config/database';
import logger from './utils/logger';

dotenv.config();

const WEBZ_API_TOKEN = process.env.WEBZ_API_TOKEN;
const WEBZ_API_BASE_URL = process.env.WEBZ_API_BASE_URL || 'https://api.webz.io';

if (!WEBZ_API_TOKEN) {
  logger.error('WEBZ_API_TOKEN environment variable is required');
  process.exit(1);
}

async function main() {
  try {
    const postRepository = new PostRepository(dbPool); 
    const webzService = new WebzService(
      WEBZ_API_TOKEN!,
      WEBZ_API_BASE_URL,
      postRepository
    );   
    const processCompleteCallback = (retrievedCount: number, totalCount: number) => {
      logger.info(`Process completed. Retrieved ${retrievedCount} posts out of ${totalCount} total posts.`);
      process.exit(0);
    };  
    const query = 'Nepal'; 
    logger.info(`Starting to fetch posts with query: "${query}"`);
    await webzService.fetchPosts(query, processCompleteCallback);
  } catch (error) {
    logger.error('An error occurred in the main application:', error);
    process.exit(1);
  }
}

main();

