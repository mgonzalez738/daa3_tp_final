import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router'
import { NgForm, PatternValidator } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth/auth.service';
import { UsersService } from '../../services/users/users.service';
import { ClientsService } from '../../services/clients/clients.service';
import { ProjectsService } from '../../services/projects/projects.service';

import { User, UserPopulated } from '../../models/userModel';
import { Client } from '../../models/clientModel';
import { Project } from '../../models/projectModel';

@Component({
  templateUrl: 'edit-user.component.html'
})
export class EditUserComponent implements OnInit {

  private paramUserId;
  public authUser: UserPopulated;
  public clients: Client[];
  public projects: Project[];
  private user: User;

  public modifyPassword = false;
  public username: string;
  public firstname: string;
  public lastname: string;
  public email: string;
  public roleSelected: string;
  public clientSelected: string;
  public projectsSelected: string[];

  public usernameError = false;
  public usernameErrorMessage = "";
  public passwordError = false;
  public passwordErrorMessage = "";
  public passwordRepeatError = false;
  public passwordRepeatErrorMessage = "";
  public firstnameError = false;
  public firstnameErrorMessage = "";
  public lastnameError = false;
  public lastnameErrorMessage = "";
  public emailError = false;
  public emailErrorMessage = "";

  public isLoading = false;
  public storeError = false;
  public storeErrorMessage = "";

  constructor(
    private usersService: UsersService,
    private clientsService: ClientsService,
    private projectsService: ProjectsService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.route.paramMap.subscribe(map => {
      this.paramUserId = map.get('userid');
    });
  }

  async ngOnInit(): Promise<void> {

    try {
      this.user = await this.usersService.getUserByUsername(this.paramUserId);
      this.username = this.user.UserId;
      this.firstname = this.user.FirstName;
      this.lastname = this.user.LastName;
      this.email = this.user.Email;
      this.roleSelected = this.user.Role;
      this.projectsSelected = this.user.ProjectsId;
      this.clientSelected = this.user.ClientId;
    } catch (error) {
      console.log(error);
      return;
    }

    try {
      this.authUser = this.authService.getAuthUser();
    } catch (error) {
      console.log(error);
      return;
    }

    if(this.authUser.Role === 'super') {
      try {
        this.clients = await this.clientsService.getClients();
      } catch (error) {
        console.log(error);
        return;
      }
    }

    try {
      if(this.authUser.Role === 'super') {
        this.projects = await this.projectsService.getProjectsByClientId(this.clientSelected);
      } else {
        this.projects = await this.projectsService.getProjects();
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }

  onModifiyPassword(event) {
    this.modifyPassword = true;
  }

  async onClientSelectChange(selected) {
    this.projects = await this.projectsService.getProjectsByClientId(selected);
  }

  async OnOk(form: NgForm) {

    let error = false;
    this.isLoading = true;
    const passwordPattern = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}");
    const whitespacePattern = new RegExp("^(?=.*\\s)");
    const letterNumberPattern = new RegExp("^(?=.*[^A-Za-z0-9])");
    const emailPattern = new RegExp("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$");

    if(form.value.username === "") {
      this.usernameError = true;
      this.usernameErrorMessage = "Usuario requerido.";
      error = true;
    } else if (whitespacePattern.test(form.value.username)){
      this.usernameError = true;
      this.usernameErrorMessage = "Espacios en blanco no permitidos.";
      error = true;
    } else if (letterNumberPattern.test(form.value.username)){
      this.usernameError = true;
      this.usernameErrorMessage = "Solo letras y numeros permitidos.";
      error = true;
    } else {
        this.usernameError = false;
    }

    if(this.modifyPassword) {
      if(form.value.password === ""){
        this.passwordError = true;
        this.passwordErrorMessage = "Contraseña requerida.";
        error = true;
      } else if (!passwordPattern.test(form.value.password)){
        this.passwordError = true;
        this.passwordErrorMessage = "Requiere 8 o más caracteres con al menos una mayúscula, una minúscula y un número.";
        error = true;
      } else {
        this.passwordError = false;
      }
    }

    if(this.modifyPassword) {
      if(form.value.passwordRepeat === ""){
        this.passwordRepeatError = true;
        this.passwordRepeatErrorMessage = "Repetir contraseña requerido.";
        error = true;
      } else if (form.value.passwordRepeat !== form.value.password){
        this.passwordRepeatError = true;
        this.passwordRepeatErrorMessage = "Las contraseñas no coinciden.";
        error = true;
      } else {
        this.passwordRepeatError = false;
      }
    }

    if(form.value.firstname === ""){
      this.firstnameError = true;
      this.firstnameErrorMessage = "Nombre requerido.";
      error = true;
    } else {
      this.firstnameError = false;
    }

    if(form.value.lastname === ""){
      this.lastnameError = true;
      this.lastnameErrorMessage = "Apellido requerido.";
      error = true;
    } else {
      this.lastnameError = false;
    }

    if(form.value.email === ""){
      this.emailError = true;
      this.emailErrorMessage = "Email requerido.";
      error = true;
    } else if (!emailPattern.test(form.value.email)) {
      this.emailError = true;
      this.emailErrorMessage = "Email inválido.";
      error = true;
    } else {
      this.emailError = false;
    }

    if(error) {
      this.isLoading = false;
      return;
    }

    this.user.UserId = form.value.username;
    if(this.modifyPassword) {
      this.user.Password = form.value.password;
    }
    this.user.FirstName = form.value.firstname;
    this.user.LastName = form.value.lastname;
    this.user.Email = form.value.email;
    this.user.Role = form.value.role;
    if(this.authUser.Role === 'super') {
        this.user.ClientId = form.value.client;
    }
    if((form.value.role !== 'super') && (form.value.role !== 'administrator')) {
      if(form.value.projects.length > 0) {
        this.user.ProjectsId = form.value.projects;
      }
    }
    if((this.authUser.Role !== 'super') && !this.user.ProjectsId.includes(this.user.ProjectId)) {
      this.user.ProjectId = null;
    }

    try {
      let res = await this.usersService.updateUser(this.user);
      this.storeError = false;
      this.storeErrorMessage = "";
      this.isLoading = false;
      this.router.navigate(['/users']);
    }
    catch (error) {
      this.storeError = true;
      this.storeErrorMessage = error.message;
      this.isLoading = false;
    }

    return;
  }

}
