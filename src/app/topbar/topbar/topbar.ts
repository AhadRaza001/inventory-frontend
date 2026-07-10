import { Component, Output, EventEmitter, inject } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { Breadcrumb } from '../../breadcrumb/breadcrumb/breadcrumb';
import { SidebarService } from '../../sidebar/sidebarService';
import { AuthService } from '../../auth/service/auth-service';

@Component({
  selector: 'app-topbar',
  imports: [AvatarModule, ButtonModule, ToolbarModule, Breadcrumb],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
 sidebarService = inject(SidebarService);
 authService = inject(AuthService);

logout(){
  this.authService.logout().subscribe();  
}
}
