export class LoginResponse {
  private Success: boolean;
  private Token: string;
  private Message: string;

  constructor(Success: boolean, Token: string){
      this.Success = Success;
      this.Token = Token;
  }

  public isSuccess(): boolean {
    return this.Success;
  }

  public getToken(): string {
      return this.Token;
  }

}
