import { Service, signal } from '@angular/core';

@Service()
export class SidebarService {
  visible = signal(false);
  pinned = signal(false);

  toggle() {
    this.visible.set(!this.visible());
  }

  open() {
    this.visible.set(true);
  }
  close() {
    // don't close if pinned
    if (!this.pinned()) {
      this.visible.set(false);
    }
  }

 togglePin() {
  this.pinned.set(!this.pinned());

  if (this.pinned()) {
    this.visible.set(true);
  }
}
}
