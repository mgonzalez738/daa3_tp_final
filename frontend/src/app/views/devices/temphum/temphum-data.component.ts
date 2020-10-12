import { AfterViewChecked, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CollapseDirective} from 'ngx-bootstrap/collapse';
import { Router, ActivatedRoute, ParamMap } from '@angular/router'
import { NgForm } from '@angular/forms';

import { SensorTempHumService } from '../../../services/sensorTempHum/sensorTempHum.service';

import { SensorTempHum, DataTempHum } from '../../../models/sensorTempHumModel';
import { PaginationData } from '../../../models/paginationDataModel';

@Component({
  templateUrl: 'tempHum-data.component.html',
})
export class TempHumDataComponent implements OnInit {

  // NavBar

  private _isCollapsed: boolean = true;
  set isCollapsed(value) {
    this._isCollapsed = value;
  }
  get isCollapsed() {
    if (this.collapseRef) {
      // temp fix for "overflow: hidden"
      if (getComputedStyle(this.collapseRef.nativeElement).getPropertyValue('display') === 'flex') {
       this.renderer.removeStyle(this.collapseRef.nativeElement, 'overflow');
      }
    }
    return this._isCollapsed;
  }
  @ViewChild(CollapseDirective, { read: ElementRef, static: false }) collapse !: CollapseDirective;
  collapseRef;

  // Line Chart

  public lineChartData: Array<any> = [];
  public lineChartLabels: Array<any> = [];
  public lineChartOptions: any = {
    animation: false,
    responsive: true,
    aspectRatio: 3,
    scales: {
      yAxes: [
        {
          id: 'y-axis-0',
          position: 'left',
          ticks: {
            stepValue : 10,
            max : 40,
            min: 0
          },
          scaleLabel: {
            display: true,
            labelString: 'Temperatura [°C]',
            fontColor: "red",
          }
        },
        {
          id: 'y-axis-1',
          position: 'right',
          ticks: {
            stepSize : 12.5,
            max : 100,
            min: 0
          },
          scaleLabel: {
            display: true,
            labelString: 'Humedad [%]',
            fontColor: "blue",
          }
        }
      ],
      xAxes: [
        {
          type: 'time',
          time: {
              minUnit: 'minute',
              displayFormats: {
                hour: 'DD/MM/YY HH:mm',
                minute: 'DD/MM/YY HH:mm'
              }
          },
          scaleLabel: {
            display: true,
            labelString: 'Fecha y Hora',
          }

        }
      ]
    },
    elements:
    {
        point:
        {
            radius: 0,
            hitRadius: 5,
            hoverRadius: 10,
            hoverBorderWidth: 2
        }
    },
    legend:
    {
      position: 'top',
      align: 'end',
      labels: {
        padding: 20
      }
    }
  };
  public lineChartColours: Array<any> = [
    { // red
      borderColor: 'rgba(255,0,0,1)',
      borderWidth: 2,
      fill: false,
    },
    { // blue
      borderColor: 'rgba(0,0,255,1)',
      borderWidth: 2,
      fill: false,
    }
  ];
  public lineChartLegend = false
  public lineChartType = 'line';

  // Pagination

  public dataTotalItems: number;
  public dataItemsPerPage = 25;
  public dataCurrentPage: number = 1;
  public paginatorMaxSize: number = 5;
  public dataFirstItemShown: number;
  public dataLastItemShown: number;

  maxSize: number = 5;
  bigTotalItems: number = 675;
  bigCurrentPage: number = 1;

  public showPlot = true;
  public radioPeriod: string;
  public radioShow: string;
  public isLoading: boolean;

  public sensorid: string;
  public sensor: SensorTempHum;
  public data: DataTempHum[];
  public pagination: PaginationData;
  public loaded = false;

  constructor (
    private router: Router,
    private route: ActivatedRoute,
    private sensorTempHumService: SensorTempHumService,
    private renderer: Renderer2,
  ) {
      this.route.paramMap.subscribe(map => {
      this.sensorid = map.get('sensorid');
    });
    this.radioPeriod = 'Day';
    this.radioShow = 'Plot';
  }

  async ngOnInit(): Promise<void> {

    try {
      this.sensor = await this.sensorTempHumService.getSensorById(this.sensorid);
    } catch (error) {
      console.log(error);
      return;
    }

    // Carga la grafica
    this.loadPlot(this.radioPeriod);

    this.loaded = true;
  }

  ngAfterViewChecked (): void {
    this.collapseRef = this.collapse;
  }

  private async loadTable(period: string, page: number) {

    this.isLoading = true;

    let to = new Date(Date.now());
    let from = new Date();
    console.log(period);
    switch(period) {
      case 'Hour':
        from.setHours(to.getHours()-1);
        break;
      case 'Day':
        from.setDate(to.getDate()-1);
        break;
      case 'Week':
        from.setDate(to.getDate()-7);
        break;
    }

    try {
      let result = await this.sensorTempHumService.getSensorsData(this.sensor._id, from, to, this.dataItemsPerPage, (page - 1)*this.dataItemsPerPage);
      this.data = result.Data;
      this.pagination = result.Pagination;
      this.dataTotalItems = this.pagination.Total;
      this.dataFirstItemShown = this.pagination.From;
      this.dataLastItemShown = this.pagination.To;
      console.log(this.dataTotalItems);
    } catch (error) {
      console.log(error);
      return;
    }

    this.isLoading = false;

  }


  private async loadPlot(period: string) {

    this.data = [];

    this.isLoading = true;

    this.lineChartData.pop();
    this.lineChartData.pop();
    this.lineChartLabels.pop();


    let to = new Date(Date.now());
    let from = new Date();

    switch(period) {
      case 'Hour':
        from.setHours(to.getHours()-1);
        break;
      case 'Day':
        from.setDate(to.getDate()-1);
        break;
      case 'Week':
        from.setDate(to.getDate()-7);
        break;
    }

    try {
      let result = await this.sensorTempHumService.getSensorsData(this.sensor._id, from, to);
      this.data = result.Data;
    } catch (error) {
      console.log(error);
      return;
    }

    let tempData: number[] = [];
    let humData: number[] = [];
    let labels: string[] = [];
    for(let i=0; i<this.data.length; i++) {
      tempData.push(this.data[i].Temperature);
      humData.push(this.data[i].Humidity);
      labels.push(this.data[i].Timestamp.toString());
    }
    this.lineChartData =[];
    this.lineChartData.push({
      data: tempData,
      label: 'Temperatura [°C]',
      yAxisID: 'y-axis-0'
    });
    this.lineChartData.push({
      data: humData,
      label: 'Humedad [%]',
      yAxisID: 'y-axis-1'
    });
    this.lineChartLabels = labels;

    this.isLoading = false;

  }


  onPeriodChange(event) {
    if(this.radioShow === 'Plot') {
      this.loadPlot(this.radioPeriod);
    }
    if(this.radioShow === 'Table') {
      this.loadTable(this.radioPeriod, this.dataCurrentPage);
    }
  }

  onShowChange(event) {
    if(this.radioShow === 'Plot') {
      this.loadPlot(this.radioPeriod);
    }
    if(this.radioShow === 'Table') {
      this.loadTable(this.radioPeriod, this.dataCurrentPage);
    }
  }

  pageChanged(event: any): void {
    this.loadTable(this.radioPeriod, event.page);
  }


}
