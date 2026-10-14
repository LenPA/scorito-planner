import { Component } from '@angular/core';

export interface RaceGame {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  colorClass: string;
  accentColor: string;
  icon: string;
  flag: string;
  route: string;
  statusText: string;
  isActive: boolean;
  edition: string;
  stats: string[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent {
  games: RaceGame[] = [
    {
      id: 'voorjaarsklassiekers',
      title: 'Voorjaarsklassiekers',
      subtitle: 'Van Omloop het Nieuwsblad tot Luik-Bastenaken-Luik',
      badge: 'Kasseien & Heuvels',
      colorClass: 'card-classics',
      accentColor: '#1e3a8a',
      icon: 'fa-bicycle',
      flag: '🇧🇪 🇫🇷',
      route: '/planner',
      statusText: 'Klaar om te plannen',
      isActive: true,
      edition: 'Editie 2026/2027',
      stats: ['16 Klassiekers', '3 Kopmannen', '€45M Budget']
    },
    {
      id: 'giro',
      title: 'Giro d\'Italia',
      subtitle: 'De strijd om de felbegeerde Maglia Rosa en zware Dolomieten',
      badge: 'Maglia Rosa',
      colorClass: 'card-giro',
      accentColor: '#ec4899',
      icon: 'fa-mountain',
      flag: '🇮🇹',
      route: '/grand-tour/giro',
      statusText: 'Klaar om te plannen',
      isActive: true,
      edition: 'Editie 2026/2027',
      stats: ['21 Etappes', '9 per rit', '4 Klassementen']
    },
    {
      id: 'tour',
      title: 'Tour de France',
      subtitle: 'Het ultieme gevecht om het Geel in Parijs over de Alpen',
      badge: 'Maillot Jaune',
      colorClass: 'card-tour',
      accentColor: '#eab308',
      icon: 'fa-trophy',
      flag: '🇫🇷',
      route: '/grand-tour/tour',
      statusText: 'Klaar om te plannen',
      isActive: true,
      edition: 'Editie 2026/2027',
      stats: ['21 Etappes', '9 per rit', '4 Klassementen']
    },
    {
      id: 'vuelta',
      title: 'Vuelta a España',
      subtitle: 'Steile muurtjes, extreme hitte en de jacht op La Roja',
      badge: 'La Roja',
      colorClass: 'card-vuelta',
      accentColor: '#dc2626',
      icon: 'fa-fire',
      flag: '🇪🇸',
      route: '/grand-tour/vuelta',
      statusText: 'Klaar om te plannen',
      isActive: true,
      edition: 'Editie 2026/2027',
      stats: ['21 Etappes', '9 per rit', '4 Klassementen']
    }
  ];
}
