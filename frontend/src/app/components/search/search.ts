import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-search',
  imports: [MatIcon],
  templateUrl: './search.html',
  styleUrl: './search.scss'
})
export class Search {
  @Input() placeholder: string = 'Search tasks';
  @Input() value: string = '';

  @Output() valueChange = new EventEmitter<string>();

  onSearchClick(): void {
    const input = document.getElementById('search-input') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.value = value;


    // add debounce of 500 ms
    setTimeout(() => {
      if (this.value === value) {
        this.value = value;
        this.valueChange.emit(this.value);
      }
    }, 500);
  }
}
