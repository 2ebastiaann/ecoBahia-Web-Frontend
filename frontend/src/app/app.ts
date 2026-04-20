import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('ecoBahia');

  constructor(private router: Router) {}

  ngOnInit() {
    // Cuando el usuario recarga la página desde el navegador (F5), 
    // forzamos a que si no está en login, lo devuelva al Dashboard (home)
    if (!window.location.pathname.includes('login')) {
      this.router.navigate(['/main']);
    }
  }
}
