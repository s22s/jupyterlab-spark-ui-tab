import {Widget} from '@phosphor/widgets'
import {ServerConnection} from '@jupyterlab/services';
import {URLExt} from '@jupyterlab/coreutils';

export class SparkWidget extends Widget {

  constructor() {
    super();
    this.id = 'spark-ui';
    this.title.label = 'Spark UI';
    this.title.closable = true;
    this.addClass("spark-ui-widget");
    this.renderApplicationsSelect();
  }

  private renderApplicationsSelect() {
    let serverSettings = ServerConnection.makeSettings();
    let header = document.createElement("h2");
    header.innerText = "Spark applications";
    let applicationSelect = document.createElement("select");
    applicationSelect.className = "spark-app-select";
    let sparkUIArea = document.createElement("iframe");
    sparkUIArea.className = "spark-ui-area";
    sparkUIArea.src = URLExt.join(serverSettings.baseUrl, "sparkuitab");
    applicationSelect.addEventListener("change", function (event) {
      console.log("selected value: " + applicationSelect.value);
      sparkUIArea.src = URLExt.join(serverSettings.baseUrl, "sparkuitab") + "?port=" + applicationSelect.value;
    });


    this.node.appendChild(header);
    this.node.appendChild(applicationSelect);
    this.node.appendChild(sparkUIArea);
    let contextPromise = SparkWidget.getRequest("spark_contexts");
    contextPromise.then(response => {
      response.json().then((ports: any) => {
        console.log("resp: " + ports)
        ports.forEach((port: any) => {
          console.log("adding option: " + port)
          let opt = document.createElement("option");
          opt.value = port[0];
          opt.text = port[1];
          applicationSelect.add(opt);
        });
      })
    })
  }

  public static getRequest(
      url: string
  ): Promise<Response> {
    let fullRequest = {
      method: 'GET'
    };
    let setting = ServerConnection.makeSettings();
    let fullUrl = URLExt.join(setting.baseUrl, url);
    return ServerConnection.makeRequest(fullUrl, fullRequest, setting);
  }


}
