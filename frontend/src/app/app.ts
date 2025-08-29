import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskService } from './services/task.service';
import { Toast } from './components/toast/toast';
import { EnvironmentService } from './services/environment.service';
import { PWAInstallComponent } from './components/pwa-install/pwa-install';
import { PWAService } from './services/pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, PWAInstallComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'Chris Bateson\'s Kanban';

  constructor(
    private taskService: TaskService,
    private environmentService: EnvironmentService,
    private pwaService: PWAService
  ) {}

  ngOnInit(): void {
    // Log environment configuration for verification
    this.environmentService.logEnvironmentInfo();

    // Initialize PWA features
    // PWAService constructor automatically handles initialization
  }
}
