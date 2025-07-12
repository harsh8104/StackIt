import { config } from '@/config/env';

const API_BASE_URL = config.API_BASE_URL;

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  reputation: number;
  badges: string[];
  questionCount?: number;
  answerCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  _id: string;
  title: string;
  description: string;
  author: User;
  tags: string[];
  votes: {
    upvotes: Array<{ user: string; createdAt: string }>;
    downvotes: Array<{ user: string; createdAt: string }>;
  };
  voteCount: number;
  views: number;
  answerCount: number;
  isAccepted: boolean;
  status: 'open' | 'closed' | 'duplicate' | 'off-topic';
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  _id: string;
  content: string;
  question: string;
  author: User;
  votes: {
    upvotes: Array<{ user: string; createdAt: string }>;
    downvotes: Array<{ user: string; createdAt: string }>;
  };
  voteCount: number;
  isAccepted: boolean;
  isEdited: boolean;
  comments: Array<{
    content: string;
    author: User;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  _id: string;
  name: string;
  description?: string;
  usageCount: number;
  createdAt: string;
}

export interface AuthResponse {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  reputation: number;
  badges: string[];
  token: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  type: 'answer' | 'vote' | 'mention' | 'comment' | 'accept';
  question?: {
    _id: string;
    title: string;
  };
  answer?: {
    _id: string;
    content: string;
  };
  content: string;
  read: boolean;
  metadata?: {
    voteType?: string;
    questionTitle?: string;
    answerPreview?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// API client class
class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add custom headers from options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response.data;
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>('/auth/me');
    return response.data;
  }

  async updateProfile(profileData: { username?: string; bio?: string; avatar?: string }): Promise<User> {
    const response = await this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  // Question methods
  async getQuestions(params?: {
    page?: number;
    limit?: number;
    sort?: 'newest' | 'votes' | 'views' | 'unanswered';
    search?: string;
    tags?: string[];
    status?: string;
  }): Promise<{ questions: Question[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.tags?.length) searchParams.append('tags', params.tags.join(','));
    if (params?.status) searchParams.append('status', params.status);

    const queryString = searchParams.toString();
    const endpoint = `/questions${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<Question[]>(endpoint);
    return {
      questions: response.data,
      pagination: response.pagination,
    };
  }

  async getQuestion(id: string): Promise<Question> {
    const response = await this.request<Question>(`/questions/${id}`);
    return response.data;
  }

  async createQuestion(questionData: {
    title: string;
    description: string;
    tags: string[];
  }): Promise<Question> {
    const response = await this.request<Question>('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
    return response.data;
  }

  async updateQuestion(id: string, questionData: {
    title?: string;
    description?: string;
    tags?: string[];
  }): Promise<Question> {
    const response = await this.request<Question>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(questionData),
    });
    return response.data;
  }

  async deleteQuestion(id: string): Promise<void> {
    await this.request(`/questions/${id}`, { method: 'DELETE' });
  }

  async voteQuestion(id: string, voteType: 'upvote' | 'downvote'): Promise<{
    voteCount: number;
    hasUpvoted: boolean;
    hasDownvoted: boolean;
  }> {
    const response = await this.request<{
      voteCount: number;
      hasUpvoted: boolean;
      hasDownvoted: boolean;
    }>(`/questions/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType }),
    });
    return response.data;
  }

  async removeVote(id: string, voteType: 'upvote' | 'downvote'): Promise<{
    voteCount: number;
    hasUpvoted: boolean;
    hasDownvoted: boolean;
  }> {
    const response = await this.request<{
      voteCount: number;
      hasUpvoted: boolean;
      hasDownvoted: boolean;
    }>(`/questions/${id}/vote?voteType=${voteType}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  async getQuestionsByUser(userId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ questions: Question[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/questions/user/${userId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<Question[]>(endpoint);
    return {
      questions: response.data,
      pagination: response.pagination,
    };
  }

  // Answer methods
  async getAnswers(questionId: string, params?: {
    page?: number;
    limit?: number;
    sort?: 'votes' | 'newest' | 'oldest';
  }): Promise<{ answers: Answer[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);

    const queryString = searchParams.toString();
    const endpoint = `/answers/question/${questionId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<Answer[]>(endpoint);
    return {
      answers: response.data,
      pagination: response.pagination,
    };
  }

  async createAnswer(answerData: {
    content: string;
    questionId: string;
  }): Promise<Answer> {
    const response = await this.request<Answer>('/answers', {
      method: 'POST',
      body: JSON.stringify(answerData),
    });
    return response.data;
  }

  async updateAnswer(id: string, content: string): Promise<Answer> {
    const response = await this.request<Answer>(`/answers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return response.data;
  }

  async deleteAnswer(id: string): Promise<void> {
    await this.request(`/answers/${id}`, { method: 'DELETE' });
  }

  async voteAnswer(id: string, voteType: 'upvote' | 'downvote'): Promise<{
    voteCount: number;
    hasUpvoted: boolean;
    hasDownvoted: boolean;
  }> {
    const response = await this.request<{
      voteCount: number;
      hasUpvoted: boolean;
      hasDownvoted: boolean;
    }>(`/answers/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType }),
    });
    return response.data;
  }

  async removeVoteAnswer(id: string, voteType: 'upvote' | 'downvote'): Promise<{
    voteCount: number;
    hasUpvoted: boolean;
    hasDownvoted: boolean;
  }> {
    const response = await this.request<{
      voteCount: number;
      hasUpvoted: boolean;
      hasDownvoted: boolean;
    }>(`/answers/${id}/vote?voteType=${voteType}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  async acceptAnswer(id: string): Promise<void> {
    await this.request(`/answers/${id}/accept`, { method: 'POST' });
  }

  async addComment(answerId: string, content: string): Promise<any> {
    const response = await this.request(`/answers/${answerId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.data;
  }

  // Tag methods
  async getTags(params?: {
    page?: number;
    limit?: number;
    sort?: 'popular' | 'name' | 'newest';
  }): Promise<{ tags: Tag[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);

    const queryString = searchParams.toString();
    const endpoint = `/tags${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<Tag[]>(endpoint);
    return {
      tags: response.data,
      pagination: response.pagination,
    };
  }

  async getPopularTags(limit?: number): Promise<Tag[]> {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.append('limit', limit.toString());
    
    const queryString = searchParams.toString();
    const endpoint = `/tags/popular${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<Tag[]>(endpoint);
    return response.data;
  }

  async searchTags(query: string, limit?: number): Promise<Tag[]> {
    const searchParams = new URLSearchParams({ q: query });
    if (limit) searchParams.append('limit', limit.toString());
    
    const endpoint = `/tags/search?${searchParams.toString()}`;
    const response = await this.request<Tag[]>(endpoint);
    return response.data;
  }

  // User methods
  async getUserProfile(id: string): Promise<User> {
    const response = await this.request<User>(`/users/${id}`);
    return response.data;
  }

  async getUserStats(id: string): Promise<any> {
    const response = await this.request(`/users/${id}/stats`);
    return response.data;
  }

  async getAllUsers(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<User[]>(endpoint);
    return {
      users: response.data,
      pagination: response.pagination,
    };
  }

  async searchUsers(params?: {
    query: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append('q', params.query);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    const endpoint = `/users/search${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<User[]>(endpoint);
    return {
      users: response.data,
      pagination: response.pagination,
    };
  }

  async getTopUsers(limit?: number, period?: 'all' | 'week' | 'month'): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.append('limit', limit.toString());
    if (period) searchParams.append('period', period);
    
    const queryString = searchParams.toString();
    const endpoint = `/users/top${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<User[]>(endpoint);
    return response.data;
  }

  // Token management
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Notification methods
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<{ notifications: Notification[]; pagination: any; unreadCount: number }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) searchParams.append('unreadOnly', params.unreadOnly.toString());

    const queryString = searchParams.toString();
    const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<Notification[]>(endpoint);
    return {
      notifications: response.data,
      pagination: response.pagination,
      unreadCount: (response as any).unreadCount || 0,
    };
  }

  async getUnreadCount(): Promise<number> {
    const response = await this.request<{ unreadCount: number }>('/notifications/unread-count');
    return response.data.unreadCount;
  }

  async markNotificationAsRead(notificationIds: string[]): Promise<{ unreadCount: number }> {
    const response = await this.request<{ unreadCount: number }>('/notifications/mark-read', {
      method: 'PUT',
      body: JSON.stringify({ notificationIds }),
    });
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.request('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string): Promise<void> {
    await this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create and export API client instance
export const api = new ApiClient(API_BASE_URL); 