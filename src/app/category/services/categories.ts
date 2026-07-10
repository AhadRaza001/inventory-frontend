import { inject, Injectable, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

@Service()
export class CategoriesService {
  private baseUrl = 'http://localhost:8000/api/categories'; // adjust to your actual API base URL

  private http = inject(HttpClient);
  // GET /categories
  getAll(): Observable<any> {
    return this.http.get(`${this.baseUrl}/all`);
  }

  getCategories(
    page: number,
    perPage: number,
    search: string,
    sortField: string,
    sortOrder: string,
    filters: any[],
  ) {
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage)
      .set('search', search)
      .set('sortField', sortField)
      .set('sortOrder', sortOrder)
      .set('filters', JSON.stringify(filters));

    return this.http.get<any>(this.baseUrl, { params });
  }

  // GET /categories/{id}
  getById(id: any): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }

  // POST /categories
  create(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, category);
  }

  // POST /categories/{id}  (your backend uses POST for update, not PUT)
  update(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/${id}`, category);
  }

  // DELETE /categories/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
