import { Injectable } from '@angular/core';
import { Recipe } from './models';

const KEY_RECIPES = 'recipes';
const KEY_DRAFT = 'recipe_draft_v1';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  getAll(): Recipe[] {
    return JSON.parse(localStorage.getItem(KEY_RECIPES) || '[]');
  }
  save(recipe: Recipe) {
    const all = this.getAll();
    const idx = all.findIndex(r => r.id === recipe.id);
    if (idx >= 0) all[idx] = recipe; else all.unshift(recipe);
    localStorage.setItem(KEY_RECIPES, JSON.stringify(all));
  }
  remove(id: string) {
    const all = this.getAll().filter(r => r.id !== id);
    localStorage.setItem(KEY_RECIPES, JSON.stringify(all));
  }
  saveDraft(draft: any) { localStorage.setItem(KEY_DRAFT, JSON.stringify(draft)); }
  readDraft(): any | null {
    const raw = localStorage.getItem(KEY_DRAFT);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  clearDraft() { localStorage.removeItem(KEY_DRAFT); }
}
