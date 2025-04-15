import { Pool, Client } from 'pg';
import { Post } from '../interfaces/WebzResponse';
import { PostRepository as IPostRepository } from '../interfaces/PostRepository';
import logger from '../utils/logger';

export class PostRepository implements IPostRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createTablesIfNotExist(): Promise<void> {
    const client = await this.pool.connect();
    try {
      logger.info("Creating database tables if they don't exist");

      await client.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          uuid VARCHAR(255) UNIQUE NOT NULL,
          url TEXT NOT NULL,
          author VARCHAR(255),
          published TIMESTAMP,
          title TEXT,
          text TEXT,
          language VARCHAR(50),
          sentiment VARCHAR(50),
          ord_in_thread INTEGER,
          parent_url TEXT,
          highlight_text TEXT,
          highlight_title TEXT,
          highlight_thread_title TEXT,
          crawled TIMESTAMP,
          updated TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS threads (
          id SERIAL PRIMARY KEY,
          uuid VARCHAR(255) UNIQUE NOT NULL,
          url TEXT NOT NULL,
          site_full TEXT,
          site VARCHAR(255),
          site_section TEXT,
          title TEXT,
          title_full TEXT,
          published TIMESTAMP,
          country VARCHAR(50),
          main_image TEXT,
          performance_score FLOAT,
          domain_rank INTEGER,
          post_uuid VARCHAR(255) REFERENCES posts(uuid) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          post_uuid VARCHAR(255) REFERENCES posts(uuid) ON DELETE CASCADE,
          category TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS entities (
          id SERIAL PRIMARY KEY,
          post_uuid VARCHAR(255) REFERENCES posts(uuid) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          name TEXT NOT NULL,
          sentiment VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      logger.info('Database tables created successfully');
    } catch (error) {
      logger.error('Error creating database tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async savePosts(posts: Post[]): Promise<number> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      let savedCount = 0;
      
      for (const post of posts) {
        // Check if post already exists
        const existingPost = await client.query(
          'SELECT uuid FROM posts WHERE uuid = $1',
          [post.uuid]
        );
        
        // Defensive check for existingPost and rows
        if (existingPost?.rows?.length > 0) {
          logger.debug(`Post ${post.uuid} already exists, skipping`);
          continue;
        }
        
        await client.query(
          `INSERT INTO posts (
            uuid, url, author, published, title, text, language, 
            sentiment, ord_in_thread, parent_url, highlight_text, 
            highlight_title, highlight_thread_title, crawled, updated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            post.uuid,
            post.url,
            post.author,
            post.published ? new Date(post.published) : null,
            post.title,
            post.text,
            post.language,
            post.sentiment,
            post.ord_in_thread,
            post.parent_url,
            post.highlightText,
            post.highlightTitle,
            post.highlightThreadTitle,
            post.crawled ? new Date(post.crawled) : null,
            post.updated ? new Date(post.updated) : null,
          ]
        );
        
        if (post.thread) {
          await client.query(
            `INSERT INTO threads (
              uuid, url, site_full, site, site_section, title, 
              title_full, published, country, main_image, 
              performance_score, domain_rank, post_uuid
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              post.thread.uuid,
              post.thread.url,
              post.thread.site_full,
              post.thread.site,
              post.thread.site_section,
              post.thread.title,
              post.thread.title_full,
              post.thread.published ? new Date(post.thread.published) : null,
              post.thread.country,
              post.thread.main_image,
              post.thread.performance_score,
              post.thread.domain_rank,
              post.uuid,
            ]
          );
        }
        
        if (post.categories && post.categories.length > 0) {
          for (const category of post.categories) {
            await client.query(
              'INSERT INTO categories (post_uuid, category) VALUES ($1, $2)',
              [post.uuid, category]
            );
          }
        }
        
        if (post.entities) {
          if (post.entities.persons && post.entities.persons.length > 0) {
            for (const person of post.entities.persons) {
              await client.query(
                'INSERT INTO entities (post_uuid, type, name, sentiment) VALUES ($1, $2, $3, $4)',
                [post.uuid, 'person', person.name, person.sentiment]
              );
            }
          }
          
          if (post.entities.organizations && post.entities.organizations.length > 0) {
            for (const org of post.entities.organizations) {
              await client.query(
                'INSERT INTO entities (post_uuid, type, name, sentiment) VALUES ($1, $2, $3, $4)',
                [post.uuid, 'organization', org.name, org.sentiment]
              );
            }
          }
          
          if (post.entities.locations && post.entities.locations.length > 0) {
            for (const location of post.entities.locations) {
              await client.query(
                'INSERT INTO entities (post_uuid, type, name, sentiment) VALUES ($1, $2, $3, $4)',
                [post.uuid, 'location', location.name, location.sentiment]
              );
            }
          }
        }
        
        savedCount++;
      }
      
      await client.query('COMMIT');
      return savedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error saving posts to database:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}