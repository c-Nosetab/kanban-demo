import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskService } from './services/task.service';
import { Toast } from './components/toast/toast';
import { EnvironmentService } from './services/environment.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'Bateson Kanban';

  constructor(
    private taskService: TaskService,
    private environmentService: EnvironmentService
  ) {}

  ngOnInit(): void {
    // Log environment configuration for verification
    this.environmentService.logEnvironmentInfo();
  }
}
