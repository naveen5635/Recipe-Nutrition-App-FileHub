import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()), // harmless even if not used
    provideAnimations(),
    provideClientHydration(),
  ],
}).catch(err => console.error(err));
