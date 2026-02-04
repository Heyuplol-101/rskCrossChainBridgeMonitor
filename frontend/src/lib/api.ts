import type {
  BridgesResponse,
  BridgeStatusResponse,
  AnomaliesResponse,
  HealthResponse,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
      );
    }
    
    return response.json();
  }

  async getHealth(): Promise<HealthResponse> {
    return this.fetch<HealthResponse>('/health');
  }

  async getBridges(): Promise<BridgesResponse> {
    return this.fetch<BridgesResponse>('/bridges');
  }

  async getBridgeStatus(id: number): Promise<BridgeStatusResponse> {
    return this.fetch<BridgeStatusResponse>(`/bridges/${id}/status`);
  }

  async getBridgeAnomalies(
    id: number,
    options?: { limit?: number; resolved?: boolean }
  ): Promise<AnomaliesResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.resolved) params.set('resolved', 'true');
    // Future: could pass offset/page for pagination
    
    const query = params.toString();
    return this.fetch<AnomaliesResponse>(
      `/bridges/${id}/anomalies${query ? `?${query}` : ''}`
    );
  }
}

export const api = new ApiClient();
