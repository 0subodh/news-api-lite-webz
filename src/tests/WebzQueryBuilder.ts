import { WebzQueryBuilder } from '../builders/WebzQueryBuilder';

describe('WebzQueryBuilder', () => {
  const token = 'test-token';
  const baseUrl = 'https://api.webz.io';
  
  it('should build a basic query with token', () => {
    const builder = new WebzQueryBuilder(token, baseUrl);
    const url = builder.build();
    
    expect(url).toBe('https://api.webz.io/newsApiLite?token=test-token');
  });
  
  it('should add search query parameter', () => {
    const builder = new WebzQueryBuilder(token, baseUrl);
    const url = builder.withQuery('technology').build();
    
    expect(url).toContain('q=technology');
  });
  
  it('should build a complex query with multiple parameters', () => {
    const builder = new WebzQueryBuilder(token, baseUrl);
    const url = builder
      .withQuery('ai')
      .withLanguage('english')
      .withSize(10)
      .withSort('relevancy')
      .withOrder('desc')
      .withHighlight(true)
      .build();
    
    expect(url).toContain('q=ai');
    expect(url).toContain('language=english');
    expect(url).toContain('size=10');
    expect(url).toContain('sort=relevancy');
    expect(url).toContain('order=desc');
    expect(url).toContain('highlight=true');
  });
  
  it('should parse and use an existing endpoint URL', () => {
    const nextUrl = '/newsApiLite?token=test-token&ts=1744180361252&q=technology&sort=relevancy&order=desc';
    const builder = new WebzQueryBuilder(token, baseUrl);
    const url = builder.withEndpoint(nextUrl).build();
    
    expect(url).toContain('token=test-token');
    expect(url).toContain('ts=1744180361252');
    expect(url).toContain('q=technology');
  });
  
  it('should limit size parameter to valid values', () => {
    const builder = new WebzQueryBuilder(token, baseUrl);
    const url = builder.withSize(500).build();
    
    // Should be limited to 100
    expect(url).toContain('size=100');
    
    const tooSmallUrl = builder.withSize(-10).build();
    // Should be limited to 1
    expect(tooSmallUrl).toContain('size=1');
  });
});