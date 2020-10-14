import { Component, OnInit, ViewChild } from '@angular/core';
import {ModalDirective} from 'ngx-bootstrap/modal';
import { Router } from '@angular/router'

import { UsersService } from '../../services/users/users.service';

import { User } from '../../models/userModel';

@Component({
  templateUrl: 'users.component.html'
})
export class UsersComponent implements OnInit {

  public users: User[];
  public selectedUser: User = null;
  @ViewChild('mogModal') public mogModal: ModalDirective;
  @ViewChild('warningModal') public warningModal: ModalDirective;
  public isDeleting: boolean = false;

  constructor(
    private usersService: UsersService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.users = await this.usersService.getUsers();
    } catch (error) {
      console.log(error);
    }
  }

  onEdit(event, user: User) {
    if(user.UserId === 'mgonzalez738') {
      this.mogModal.show();
      return;
    }
    this.router.navigate(['/users', user.UserId]);
  }

  onDeleteRequest(event, user: User) {
    if(user.UserId === 'mgonzalez738') {
      this.mogModal.show();
    } else {
      this.selectedUser = user;
      this.warningModal.show();
    }
  }

  onMogCancel(event) {
    this.mogModal.hide();
  }

  onDeleteCancel(event) {
    this.selectedUser = null;
    this.warningModal.hide();
  }

  async onDeleteOk(event) {
    this.isDeleting = true;
    try {
      await this.usersService.deleteUser(this.selectedUser._id);
      this.users = await this.usersService.getUsers();
    } catch (error) {
      console.log(error);
    }
    this.selectedUser = null;
    this.warningModal.hide();
    this.isDeleting = false;
  }

}
