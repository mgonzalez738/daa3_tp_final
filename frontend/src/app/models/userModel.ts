import { Company } from './companyModel';
import { Project } from './projectModel';
import { Client } from './clientModel';

export class User {
  public _id: string;
  public UserId: string;
  public Password: string;
  public FirstName: string;
  public LastName: string;
  public Email: string;
  public Role: string;
  public CompanyId: string;
  public ProjectsId: string[];
  public ClientId: string;
  public ProjectId: string;

  constructor(){ }
}

export class UserPopulated {
  public _id: string;
  public UserId: string;
  public FirstName: string;
  public LastName: string;
  public Email: string;
  public Role: string;
  public Company: Company;
  public Projects: Project[];
  public Client: Client;
  public Project: Project;

  constructor(){ }
}


