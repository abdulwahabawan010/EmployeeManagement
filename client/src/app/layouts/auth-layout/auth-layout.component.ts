import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Auth Layout - Simple centered layout for login/register pages
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss'
})
export class AuthLayoutComponent {}
