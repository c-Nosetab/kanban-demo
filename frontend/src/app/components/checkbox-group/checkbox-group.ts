import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-checkbox-group',
  imports: [
    MatIconModule,
  ],
  templateUrl: './checkbox-group.html',
  styleUrls: ['./checkbox-group.scss']
})
export class CheckboxGroup {
  @Input() label: string = '';
  @Input() options: { label: string; value: string }[] = [];
  @Input() selectedOptions: string[] = [];
  @Output() optionSelected = new EventEmitter<{ option: string, isSelected: boolean }>();

  onOptionSelected(value: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const isSelected = this.selectedOptions.includes(value);

    if (isSelected) {
      this.selectedOptions = [...this.selectedOptions, value];
    } else {
      this.selectedOptions = this.selectedOptions.filter(opt => opt !== value);
    }

    this.optionSelected.emit(
      { option: value, isSelected }
    );
  }

}
