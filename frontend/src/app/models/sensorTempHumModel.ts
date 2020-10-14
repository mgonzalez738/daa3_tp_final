export class SensorTempHum {
  public _id: string;
  public Name: string;
  public Location: {
    Latitude: number,
    Longitude: number
  }
  ConnectionString: string;
  Configuration: {
    PollPeriod: number
  }
  ClientId: string;
  ProjectId: string;
  public CreatedAt: Date;

  constructor(){ }
}

export class DataTempHum {
  public _id: string;
  public Timestamp: Date;
  public Temperature: number;
  public Humidity: number;
  public SensorId: string;

  constructor(){ }
}

export class EventTempHum {
  public _id: string;
  public Timestamp: Date;
  public Message: string;
  public SensorId: string;

  constructor(){ }
}


