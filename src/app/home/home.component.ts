import { Component } from '@angular/core';

export interface RaceGame {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  colorClass: string;
  accentColor: string;
  icon: string;
  route: string;
  statusText: string;
  isActive: boolean;
  edition: string;
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
      subtitle: '16 Klassiekers • Van de Omloop t/m Luik-Bastenaken-Luik',
      badge: 'Kasseien & Heuvels',
      colorClass: 'card-classics',
      accentColor: '#1e3a8a',
      icon: 'fa-bicycle',
      route: '/planner',
      statusText: 'Planner Open',
      isActive: true,
      edition: 'Seizoen 2026 / 2027'
    },
    {
      id: 'giro',
      title: 'Giro d\'Italia',
      subtitle: '21 Etappes • De strijd om de felbegeerde Maglia Rosa',
      badge: 'Maglia Rosa',
      colorClass: 'card-giro',
      accentColor: '#ec4899',
      icon: 'fa-mountain',
      route: '/planner',
      statusText: 'Binnenkort',
      isActive: false,
      edition: 'Seizoen 2027'
    },
    {
      id: 'tour',
      title: 'Tour de France',
      subtitle: '21 Etappes • Het ultieme gevecht om het Geel in Parijs',
      badge: 'Maillot Jaune',
      colorClass: 'card-tour',
      accentColor: '#eab308',
      icon: 'fa-trophy',
      route: '/planner',
      statusText: 'Binnenkort',
      isActive: false,
      edition: 'Seizoen 2027'
    },
    {
      id: 'vuelta',
      title: 'Vuelta a España',
      subtitle: '21 Etappes • Vuile steile beklimmingen om La Roja',
      badge: 'La Roja',
      colorClass: 'card-vuelta',
      accentColor: '#dc2626',
      icon: 'fa-fire',
      route: '/planner',
      statusText: 'Binnenkort',
      isActive: false,
      edition: 'Seizoen 2027'
    }
  ];
}
