import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NutritionService } from './nutrition.service';
import { RecipeService } from './recipe.service';
import { Recipe, RecipeIngredient, Nutrition } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private fb = inject(FormBuilder);
  private nutrition = inject(NutritionService);
  private recipes = inject(RecipeService);

  title = 'Recipe Nutrition App';
  loading = signal(false);
  info = signal<string | null>(null);
  error = signal<string | null>(null);

  list = signal<Recipe[]>([]);

  form = this.fb.group({
    id: [''],
    title: ['', [Validators.required, Validators.minLength(2)]],
    ingredients: this.fb.array<ReturnType<this['ingredientGroup']>>([]),
    steps: this.fb.array<string>([])
  });

  ngOnInit(): void {
    this.list.set(this.recipes.getAll());
    if (this.ingredients.length === 0) this.addIngredient();
    if (this.steps.length === 0) this.addStep();

    const draft = this.recipes.readDraft();
    if (draft) {
      this.form.patchValue({ id: draft.id || '', title: draft.title || '' }, { emitEvent: false });
      this.setArray(this.ingredients, (draft.ingredients || []).map((i: any) => this.ingredientGroup(i.name, i.nutrition || null)));
      this.setArray(this.steps, (draft.steps || ['']).map((s: string) => this.fb.control(s)));
    }
    this.form.valueChanges.subscribe(v => this.recipes.saveDraft(v));
  }

  ingredientGroup(name = '', nutrition: Nutrition | null = null) {
    return this.fb.group({
      name: [name, [Validators.required, Validators.minLength(2)]],
      nutrition: [nutrition]
    });
  }

  get ingredients(): FormArray { return this.form.get('ingredients') as FormArray; }
  get steps(): FormArray { return this.form.get('steps') as FormArray; }

  addIngredient() { this.ingredients.push(this.ingredientGroup()); }
  removeIngredient(i: number) { this.ingredients.removeAt(i); }

  addStep() { this.steps.push(this.fb.control('')); }
  removeStep(i: number) { this.steps.removeAt(i); }

  lookup(i: number) {
    const ctrl = this.ingredients.at(i);
    const name = (ctrl.value as any).name?.trim();
    if (!name) { this.toast('Please enter a name first'); return; }
    this.loading.set(true);
    this.error.set(null);
    this.nutrition.searchIngredient(name).subscribe({
      next: n => {
        this.loading.set(false);
        if (!n) {
          ctrl.patchValue({ nutrition: null });
          this.toast(`No nutrition found for "${name}" (404)`);
        } else {
          ctrl.patchValue({ nutrition: n });
          this.toast(`Fetched nutrition for "${n.name}"`);
        }
      },
      error: e => { this.loading.set(false); this.error.set(String(e)); }
    });
  }

  saveRecipe() {
    if (this.form.invalid) { this.toast('Please fill required fields'); return; }
    const val = this.form.value;
    const id = val.id || crypto.randomUUID();
    const recipe: Recipe = {
      id,
      title: val.title!,
      ingredients: (val.ingredients || []) as unknown as RecipeIngredient[],
      steps: (val.steps || []) as string[],
      createdAt: new Date().toISOString()
    };
    this.recipes.save(recipe);
    this.list.set(this.recipes.getAll());
    this.form.patchValue({ id }, { emitEvent: false });
    this.toast('Recipe saved');
  }

  editRecipe(r: Recipe) {
    this.form.patchValue({ id: r.id, title: r.title }, { emitEvent: false });
    this.setArray(this.ingredients, r.ingredients.map(i => this.ingredientGroup(i.name, i.nutrition || null)));
    this.setArray(this.steps, r.steps.map(s => this.fb.control(s)));
    this.toast(`Editing "${r.title}"`);
  }

  deleteRecipe(r: Recipe) {
    this.recipes.remove(r.id);
    this.list.set(this.recipes.getAll());
    this.toast('Recipe deleted');
    if (this.form.value.id === r.id) {
      this.form.reset(); this.setArray(this.ingredients, []); this.setArray(this.steps, []);
      this.addIngredient(); this.addStep();
    }
  }

  clearDraft() { this.recipes.clearDraft(); this.toast('Draft cleared (persistence off until you type again)'); }

  seedTwo() {
    this.loading.set(true); this.error.set(null);
    this.nutrition.seedTwoIngredients().subscribe({
      next: _ => { this.loading.set(false); this.toast('Seeded 2 ingredients via POST'); },
      error: e => { this.loading.set(false); this.error.set(String(e)); }
    });
  }

  listRemote() {
    this.loading.set(true);
    this.nutrition.listIngredients().subscribe({
      next: items => { this.loading.set(false); this.toast(`Remote ingredients: ${items.length}`); this.remote.set(items); },
      error: e => { this.loading.set(false); this.error.set(String(e)); }
    });
  }

  remote = signal<Nutrition[]>([]);

  private setArray<T>(arr: FormArray, items: T[]) {
    while (arr.length) arr.removeAt(0);
    for (const item of items as any[]) arr.push(item);
  }

  private toast(msg: string) {
    this.info.set(msg);
    setTimeout(() => this.info.set(null), 2200);
  }

  totalMacros = computed(() => {
    const v = this.form.value;
    const ing = (v.ingredients || []) as any[];
    const sum = ing.reduce((acc, i) => {
      if (i?.nutrition) {
        acc.carbs += Number(i.nutrition.carbs) || 0;
        acc.fat += Number(i.nutrition.fat) || 0;
        acc.protein += Number(i.nutrition.protein) || 0;
      }
      return acc;
    }, { carbs: 0, fat: 0, protein: 0 });
    return sum;
  });
}
