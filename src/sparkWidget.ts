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
    this.listRepositories();
  }

  private listRepositories() {
    let header = document.createElement("h2");
    header.innerText = "Spark applications";
    let applicationSelect = document.createElement("select");
    applicationSelect.className = "spark-app-select";
    var opt = document.createElement("option");
    opt.value = "1";
    opt.text = "Option: Value 2";
    applicationSelect.add(opt);

    this.node.appendChild(header);
    this.node.appendChild(applicationSelect);
    let contextPromise = SparkWidget.getRequest("spark_contexts");
    contextPromise.then(response => {
      response.json().then((ports: any) => {
        console.log("resp: " + ports)
        ports.forEach((port: any) => {
          console.log("adding option: " + port)
          let opt = document.createElement("option");
          opt.value = port;
          opt.text = port;
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
