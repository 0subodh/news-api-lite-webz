/**
 * Builder pattern implementation for creating Webz.io API queries
 */
export class WebzQueryBuilder {
    private token: string;
    private baseUrl: string;
    private queryParams: Map<string, string | number | boolean>;
  
    constructor(token: string, baseUrl: string = 'https://api.webz.io') {
      this.token = token;
      this.baseUrl = baseUrl;
      this.queryParams = new Map<string, string | number | boolean>();
      
      // Set the token by default
      this.queryParams.set('token', this.token);
    }
  
    /**
     * Set the search query
     */
    withQuery(query: string): WebzQueryBuilder {
      this.queryParams.set('q', query);
      return this;
    }
  
    /**
     * Set the language filter
     */
    withLanguage(language: string): WebzQueryBuilder {
      this.queryParams.set('language', language);
      return this;
    }
  
    /**
     * Set the result size (1-100)
     */
    withSize(size: number): WebzQueryBuilder {
      const validSize = Math.min(Math.max(1, size), 100);
      this.queryParams.set('size', validSize);
      return this;
    }
  
    /**
     * Set the sort field
     */
    withSort(sort: 'relevancy' | 'date'): WebzQueryBuilder {
      this.queryParams.set('sort', sort);
      return this;
    }
  
    /**
     * Set the sort order
     */
    withOrder(order: 'asc' | 'desc'): WebzQueryBuilder {
      this.queryParams.set('order', order);
      return this;
    }
  
    /**
     * Set the start date filter
     */
    withStartDate(date: Date): WebzQueryBuilder {
      this.queryParams.set('ts', date.getTime());
      return this;
    }
  
    /**
     * Set the offset (starting position)
     */
    withOffset(offset: number): WebzQueryBuilder {
      this.queryParams.set('from', offset);
      return this;
    }
  
    /**
     * Set whether to highlight matches in the results
     */
    withHighlight(highlight: boolean): WebzQueryBuilder {
      this.queryParams.set('highlight', highlight);
      return this;
    }
  
    /**
     * Use a specific endpoint path
     */
    withEndpoint(endpoint: string): WebzQueryBuilder {
      if (endpoint.startsWith('/')) {
        // If the endpoint is a relative path, use it directly
        const url = new URL(endpoint, this.baseUrl);
        
        // Extract parameters from the provided endpoint
        const searchParams = new URLSearchParams(url.search);
        
        // Clear existing parameters and set from the endpoint
        this.queryParams.clear();
        for (const [key, value] of searchParams.entries()) {
          this.queryParams.set(key, value);
        }
        
        return this;
      }
      
      // If it's a full URL, extract the path and parameters
      try {
        const url = new URL(endpoint);
        const searchParams = new URLSearchParams(url.search);
        
        // Clear existing parameters and set from the endpoint
        this.queryParams.clear();
        for (const [key, value] of searchParams.entries()) {
          this.queryParams.set(key, value);
        }
        
        return this;
      } catch (error) {
        throw new Error('Invalid endpoint URL provided');
      }
    }
  
    /**
     * Build the final URL for the API request
     */
    build(): string {
      const url = new URL('/newsApiLite', this.baseUrl);
      
      // Add all parameters to the URL
      this.queryParams.forEach((value, key) => {
        url.searchParams.append(key, String(value));
      });
      
      return url.toString();
    }
  }