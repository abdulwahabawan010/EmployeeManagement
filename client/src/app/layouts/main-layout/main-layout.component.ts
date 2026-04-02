import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services';

/**
 * Main Layout - Dashboard layout with sidebar and header
 *
 * Enterprise patterns:
 * - Responsive sidebar (collapsible)
 * - Active route highlighting
 * - User menu with logout
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  authService = inject(AuthService);

  sidebarCollapsed = signal(false);
  userMenuOpen = signal(false);

  /**
   * Navigation items
   */
  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/departments', label: 'Departments', icon: '🏢' },
    { path: '/employees', label: 'Employees', icon: '👥' }
  ];

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  /**
   * Toggle user menu
   */
  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  /**
   * Close user menu
   */
  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout();
  }
}
