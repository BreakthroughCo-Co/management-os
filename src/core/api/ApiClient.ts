export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: any): Promise<T>;
  put<T>(path: string, body: any): Promise<T>;
  delete<T>(path: string): Promise<T>;
}
