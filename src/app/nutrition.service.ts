import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable, from, map, mergeMap, forkJoin } from 'rxjs';
import { Nutrition } from './models';

@Injectable({ providedIn: 'root' })
export class NutritionService {
  private base = environment.API_BASE_URL;

  private authHeader(): Headers {
    const token = btoa(`${environment.API_USERNAME}:${environment.API_PASSWORD}`);
    const h = new Headers();
    h.set('Authorization', `Basic ${token}`);
    return h;
  }

  listIngredients(): Observable<Nutrition[]> {
    return from(fetch(`${this.base}/ingredients.php`, {
      method: 'GET',
      headers: this.authHeader(),
    })).pipe(
      mergeMap(async (res) => {
        if (!res.ok) throw new Error(`GET /ingredients.php failed: ${res.status} ${await res.text()}`);
        return res.json();
      }),
      map((arr: unknown) => (Array.isArray(arr) ? (arr as Nutrition[]) : [])),
    );
  }

  searchIngredient(name: string): Observable<Nutrition | null> {
    const url = `${this.base}/ingredients.php?ingredient=${encodeURIComponent(name)}`;
    return from(fetch(url, {
      method: 'GET',
      headers: this.authHeader(),
    })).pipe(
      mergeMap(async (res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`GET ?ingredient= failed: ${res.status} ${await res.text()}`);
        return res.json() as Promise<Nutrition>;
      })
    );
  }

  addIngredient(payload: { name: string; carbs: number; fat: number; protein: number }): Observable<any> {
    const body = new URLSearchParams({
      name: payload.name,
      carbs: String(payload.carbs),
      fat: String(payload.fat),
      protein: String(payload.protein),
    }).toString();

    const headers = this.authHeader();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');

    return from(fetch(`${this.base}/ingredients.php`, {
      method: 'POST',
      headers,
      body,
    })).pipe(
      mergeMap(async (res) => {
        if (!res.ok) throw new Error(`POST /ingredients.php failed: ${res.status} ${await res.text()}`);
        // API may return JSON or text — just return text for robustness
        const text = await res.text();
        try { return JSON.parse(text); } catch { return text; }
      })
    );
  }

  // Part 1 helper: submit two ingredients
  seedTwoIngredients(): Observable<any[]> {
    const a = { name: 'Plantain', carbs: 31, fat: 0.4, protein: 1.3 };
    const b = { name: 'Kefir', carbs: 4.5, fat: 3.5, protein: 3.3 };
    return forkJoin([this.addIngredient(a), this.addIngredient(b)]);
  }
}
