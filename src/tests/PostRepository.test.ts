import { Pool } from 'pg';
import { PostRepository } from '../repositories/PostRepository';
import { Post, Entities, Thread } from '../interfaces/WebzResponse';

// Mock the pg library
jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    on: jest.fn(),
  };

  return { Pool: jest.fn(() => mockPool) };
});

describe('PostRepository', () => {
  let repository: PostRepository;
  let mockPool: any;
  let mockClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPool = require('pg').Pool();
    mockClient = await mockPool.connect();
    repository = new PostRepository(mockPool);
  });

  it('should create tables if they do not exist', async () => {
    // Arrange
    mockClient.query.mockResolvedValue({ rows: [] });

    // Act
    await repository.createTablesIfNotExist();

    // Assert
    expect(mockClient.query).toHaveBeenCalledTimes(4);
    expect(mockClient.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('CREATE TABLE IF NOT EXISTS posts'),
    );
    expect(mockClient.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('CREATE TABLE IF NOT EXISTS threads'),
    );
    expect(mockClient.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('CREATE TABLE IF NOT EXISTS categories'),
    );
    expect(mockClient.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('CREATE TABLE IF NOT EXISTS entities'),
    );
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should save new posts and related data', async () => {
    // Arrange
    const mockPosts: Post[] = [
      {
        uuid: 'post1',
        url: 'http://example.com/post1',
        ord_in_thread: 1,
        parent_url: null,
        author: 'Author 1',
        published: '2023-01-01T12:00:00Z',
        title: 'Test Post',
        text: 'Test content',
        highlightText: '',
        highlightTitle: '',
        highlightThreadTitle: '',
        language: 'english',
        sentiment: 'neutral',
        categories: ['tech', 'news'],
        external_links: [],
        external_images: [],
        entities: {
          persons: [{ name: 'Person 1', sentiment: 'positive' }],
          organizations: [{ name: 'Org 1', sentiment: 'neutral' }],
          locations: [],
        },
        rating: null,
        crawled: '2023-01-01T12:00:00Z',
        updated: '2023-01-01T12:00:00Z',
        thread: {
          uuid: 'thread1',
          url: 'http://example.com',
          site_full: 'example.com',
          site: 'example',
          site_section: 'blog',
          site_categories: [],
          section_title: 'Blog',
          title: 'Thread Title',
          title_full: 'Thread Full Title',
          published: '2023-01-01T12:00:00Z',
          replies_count: 0,
          participants_count: 1,
          site_type: 'blog',
          country: 'US',
          main_image: 'http://example.com/image.jpg',
          performance_score: 0.8,
          domain_rank: 100,
          domain_rank_updated: '2023-01-01',
          social: { updated: '2023-01-01' },
        },
      },
    ];

    mockClient.query
      .mockResolvedValueOnce({ rowCount: 1 }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT uuid (post doesn't exist)
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT posts
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT threads
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT categories (tech)
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT categories (news)
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT entities (person)
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT entities (org)
      .mockResolvedValueOnce({ rowCount: 1 }); // COMMIT

    // Act
    const savedCount = await repository.savePosts(mockPosts);

    // Assert
    expect(savedCount).toBe(1);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT uuid FROM posts WHERE uuid'),
      ['post1'],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO posts'),
      expect.arrayContaining(['post1', 'http://example.com/post1']),
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO threads'),
      expect.arrayContaining(['thread1', 'http://example.com', expect.any(Date), 'post1']),
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO categories'),
      ['post1', 'tech'],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO categories'),
      ['post1', 'news'],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entities'),
      ['post1', 'person', 'Person 1', 'positive'],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entities'),
      ['post1', 'organization', 'Org 1', 'neutral'],
    );
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should skip existing posts', async () => {
    // Arrange
    const mockPosts: Post[] = [
      {
        uuid: 'post1',
        url: 'http://example.com/post1',
        ord_in_thread: 1,
        parent_url: null,
        author: 'Author 1',
        published: '2023-01-01T12:00:00Z',
        title: 'Test Post',
        text: 'Test content',
        highlightText: '',
        highlightTitle: '',
        highlightThreadTitle: '',
        language: 'english',
        sentiment: 'neutral',
        categories: [],
        external_links: [],
        external_images: [],
        entities: { persons: [], organizations: [], locations: [] },
        rating: null,
        crawled: '2023-01-01T12:00:00Z',
        updated: '2023-01-01T12:00:00Z',
        thread: {
          uuid: 'thread1',
          url: 'http://example.com',
          site_full: 'example.com',
          site: 'example',
          site_section: 'blog',
          site_categories: [],
          section_title: 'Blog',
          title: 'Thread Title',
          title_full: 'Thread Full Title',
          published: '2023-01-01T12:00:00Z',
          replies_count: 0,
          participants_count: 1,
          site_type: 'blog',
          country: 'US',
          main_image: 'http://example.com/image.jpg',
          performance_score: 0.8,
          domain_rank: 100,
          domain_rank_updated: '2023-01-01',
          social: { updated: '2023-01-01' },
        },
      },
    ];

    mockClient.query
      .mockResolvedValueOnce({ rowCount: 1 }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ uuid: 'post1' }] }) // Post exists
      .mockResolvedValueOnce({ rowCount: 1 }); // COMMIT

    // Act
    const savedCount = await repository.savePosts(mockPosts);

    // Assert
    expect(savedCount).toBe(0);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT uuid FROM posts WHERE uuid'),
      ['post1'],
    );
    expect(mockClient.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO posts'),
      expect.anything(),
    );
    expect(mockClient.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO threads'),
      expect.anything(),
    );
    expect(mockClient.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO categories'),
      expect.anything(),
    );
    expect(mockClient.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entities'),
      expect.anything(),
    );
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should handle empty post array', async () => {
    // Arrange
    const mockPosts: Post[] = [];
    mockClient.query
      .mockResolvedValueOnce({ rowCount: 1 }) // BEGIN
      .mockResolvedValueOnce({ rowCount: 1 }); // COMMIT

    // Act
    const savedCount = await repository.savePosts(mockPosts);

    // Assert
    expect(savedCount).toBe(0);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.query).not.toHaveBeenCalledWith(
      expect.stringContaining('SELECT uuid FROM posts'),
      expect.anything(),
    );
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should handle database errors during savePosts', async () => {
    // Arrange
    const mockPosts: Post[] = [
      {
        uuid: 'post1',
        url: 'http://example.com/post1',
        ord_in_thread: 1,
        parent_url: null,
        author: 'Author 1',
        published: '2023-01-01T12:00:00Z',
        title: 'Test Post',
        text: 'Test content',
        highlightText: '',
        highlightTitle: '',
        highlightThreadTitle: '',
        language: 'english',
        sentiment: 'neutral',
        categories: [],
        external_links: [],
        external_images: [],
        entities: { persons: [], organizations: [], locations: [] },
        rating: null,
        crawled: '2023-01-01T12:00:00Z',
        updated: '2023-01-01T12:00:00Z',
        thread: {
          uuid: 'thread1',
          url: 'http://example.com',
          site_full: 'example.com',
          site: 'example',
          site_section: 'blog',
          site_categories: [],
          section_title: 'Blog',
          title: 'Thread Title',
          title_full: 'Thread Full Title',
          published: '2023-01-01T12:00:00Z',
          replies_count: 0,
          participants_count: 1,
          site_type: 'blog',
          country: 'US',
          main_image: 'http://example.com/image.jpg',
          performance_score: 0.8,
          domain_rank: 100,
          domain_rank_updated: '2023-01-01',
          social: { updated: '2023-01-01' },
        },
      },
    ];

    mockClient.query
      .mockResolvedValueOnce({ rowCount: 1 }) // BEGIN
      .mockRejectedValueOnce(new Error('Database error')) // SELECT fails
      .mockResolvedValueOnce({ rowCount: 1 }); // ROLLBACK

    // Act & Assert
    await expect(repository.savePosts(mockPosts)).rejects.toThrow('Database error');
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT uuid FROM posts WHERE uuid'),
      ['post1'],
    );
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});