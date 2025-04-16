import { WebzService } from '../services/WebzService';
import { Post } from '../interfaces/WebzResponse';
import { PostRepository } from '../interfaces/PostRepository';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a mock PostRepository
class MockPostRepository implements PostRepository {
  public savedPosts: Post[] = [];
  
  async savePosts(posts: Post[]): Promise<number> {
    this.savedPosts = [...this.savedPosts, ...posts];
    return posts.length;
  }
  
  async createTablesIfNotExist(): Promise<void> {
    return Promise.resolve();
  }
}

describe('WebzService', () => {
  const token = 'test-token';
  const baseUrl = 'https://api.webz.io';
  let postRepository: MockPostRepository;
  let webzService: WebzService;
  
  beforeEach(() => {
    // Reset mocks and repository before each test
    jest.resetAllMocks();
    postRepository = new MockPostRepository();
    webzService = new WebzService(token, baseUrl, postRepository);
  });
  
  it('should fetch and save posts from the API', async () => {
    // Mock API response for the first call
    const mockResponse = {
      data: {
        posts: [
          {
            uuid: 'post1',
            title: 'Test Post 1',
            // ... other post fields
          },
          {
            uuid: 'post2',
            title: 'Test Post 2',
            // ... other post fields
          }
        ],
        totalResults: 2,
        moreResultsAvailable: 0,
        requestsLeft: 100,
        warnings: null
      }
    };
    
    mockedAxios.get.mockResolvedValueOnce(mockResponse);
    
    // Call the service
    const callback = jest.fn();
    await webzService.fetchPosts('technology', callback);
    
    // Check if axios was called with the correct URL
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('token=test-token')
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('q=technology')
    );
    
    // Check if posts were saved to the repository
    expect(postRepository.savedPosts.length).toBe(2);
    
    // Check if callback was called with the correct counts
    expect(callback).toHaveBeenCalledWith(2, 2);
  });
  
  it('should handle pagination and fetch multiple pages', async () => {
    // Mock first page response
    const mockFirstResponse = {
      data: {
        posts: [{ uuid: 'post1' }, { uuid: 'post2' }],
        totalResults: 4,
        moreResultsAvailable: 2,
        next: '/newsApiLite?token=test-token&from=2&q=technology',
        requestsLeft: 99,
        warnings: null
      }
    };
    
    // Mock second page response
    const mockSecondResponse = {
      data: {
        posts: [{ uuid: 'post3' }, { uuid: 'post4' }],
        totalResults: 4,
        moreResultsAvailable: 0,
        requestsLeft: 98,
        warnings: null
      }
    };
    
    mockedAxios.get.mockResolvedValueOnce(mockFirstResponse);
    mockedAxios.get.mockResolvedValueOnce(mockSecondResponse);
    
    // Call the service
    const callback = jest.fn();
    await webzService.fetchPosts('technology', callback);
    
    // Check if axios was called twice for pagination
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    
    // Check if all posts from both pages were saved
    expect(postRepository.savedPosts.length).toBe(4);
    
    // Check if callback was called with correct total
    expect(callback).toHaveBeenCalledWith(4, 4);
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
    
    // Call the service with error expectation
    const callback = jest.fn();
    await expect(webzService.fetchPosts('technology', callback))
      .rejects.toThrow('API Error');
    
    // Check callback was not called
    expect(callback).not.toHaveBeenCalled();
  });
});