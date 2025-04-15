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
  
    withQuery(query: string): WebzQueryBuilder {
      this.queryParams.set('q', query);
      return this;
    }
  
    withLanguage(language: string): WebzQueryBuilder {
      this.queryParams.set('language', language);
      return this;
    }
  
    withSize(size: number): WebzQueryBuilder {
      const validSize = Math.min(Math.max(1, size), 100);
      this.queryParams.set('size', validSize);
      return this;
    }

    withSort(sort: 'relevancy' | 'date'): WebzQueryBuilder {
      this.queryParams.set('sort', sort);
      return this;
    }

    withOrder(order: 'asc' | 'desc'): WebzQueryBuilder {
      this.queryParams.set('order', order);
      return this;
    }

    withStartDate(date: Date): WebzQueryBuilder {
      this.queryParams.set('ts', date.getTime());
      return this;
    }

    withOffset(offset: number): WebzQueryBuilder {
      this.queryParams.set('from', offset);
      return this;
    }

    withHighlight(highlight: boolean): WebzQueryBuilder {
      this.queryParams.set('highlight', highlight);
      return this;
    }

    withEndpoint(endpoint: string): WebzQueryBuilder {
      if (endpoint.startsWith('/')) {
        const url = new URL(endpoint, this.baseUrl);
        
        const searchParams = new URLSearchParams(url.search);
        
        this.queryParams.clear();
        for (const [key, value] of searchParams.entries()) {
          this.queryParams.set(key, value);
        }
        
        return this;
      }
      
      try {
        const url = new URL(endpoint);
        const searchParams = new URLSearchParams(url.search);
        
        this.queryParams.clear();
        for (const [key, value] of searchParams.entries()) {
          this.queryParams.set(key, value);
        }
        
        return this;
      } catch (error) {
        throw new Error('Invalid endpoint URL provided');
      }
    }

    build(): string {
      const url = new URL('/newsApiLite', this.baseUrl);
      
      this.queryParams.forEach((value, key) => {
        url.searchParams.append(key, String(value));
      });
      
      return url.toString();
    }
  }