import { Component, EventEmitter, Input, Output, ViewChild ,HostListener, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { StyleClassModule } from 'primeng/styleclass';
import { SidebarService } from '../sidebarService';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-sidebar',
  imports: [AvatarModule, ButtonModule, DrawerModule, RippleModule, RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {

// @Input() visible: boolean = false;
//  @Output() visibleChange = new EventEmitter<boolean>();

//     closeSidebar() {
//     this.visible = false;
//     this.visibleChange.emit(this.visible);
//   }

// layout/sidebar/sidebar.component.ts


sidebarService = inject(SidebarService);
cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

@HostListener('document:click', ['$event'])
clickOutside(event: MouseEvent) {

  // if sidebar is pinned, do nothing
  if (this.sidebarService.pinned()) {
    return;
  }



  const target = event.target as HTMLElement;


  const drawer = document.querySelector('.p-drawer');


  if (drawer && !drawer.contains(target)) {

    this.sidebarService.close();

  }

}

onVisibleChange(value:boolean){

    if(this.sidebarService.pinned()){
        return;
    }

    this.sidebarService.visible.set(value);

}

drawerVisible = true;


togglePin() {

  // remove drawer first
  this.drawerVisible = false;


  setTimeout(() => {

    // change pin state after drawer removed
    this.sidebarService.togglePin();


    // recreate drawer
    this.drawerVisible = true;
    
    // force Angular update
    this.cdr.detectChanges();

  }, 50);

}
}