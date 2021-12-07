// #docregion
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Hero } from '../hero';

@Component({
  selector: 'hero-detail',
  template: `
    <h2>{{hero.name}} details!</h2>
    <!-- eslint-disable-next-line @angular-eslint/template/accessibility-label-has-associated-control -->
    <div><label>id: </label>{{hero.id}}</div>
    <button (click)="onDelete()">Delete</button>
  `
})
export class HeroDetailComponent {
  @Input() hero!: Hero;
  @Output() deleted = new EventEmitter<Hero>();
  onDelete() {
    this.deleted.emit(this.hero);
  }
}
