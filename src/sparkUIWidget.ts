import {Widget} from '@lumino/widgets'
import {ServerConnection} from '@jupyterlab/services';
import {URLExt} from '@jupyterlab/coreutils';
import { refreshIcon } from '@jupyterlab/ui-components';

/**
 * This widget display spark web ui console.
 */
export class SparkUIWidget extends Widget {

  constructor() {
    super();
    this.id = 'spark-ui';
    this.title.label = 'Spark UI';
    this.title.closable = true;
    this.addClass("spark-ui-widget");
    this.renderWidget();
  }

  private renderWidget() {
    let serverSettings = ServerConnection.makeSettings();
    let selectLabel = document.createElement("label");
    selectLabel.className = "spark-select-label"
    selectLabel.innerText = "Running spark applications:";
    // Html select with running spark applications.
    let applicationSelect = document.createElement("select");
    applicationSelect.className = "spark-app-select";
    // IFrame with spark ui content
    let sparkUIFrame = document.createElement("iframe");
    sparkUIFrame.className = "spark-ui-area";
    applicationSelect.addEventListener("change", function () {
      console.log("applicationSelect - change");
      sparkUIFrame.src = URLExt.join(serverSettings.baseUrl, "sparkuitab") + "?port=" + applicationSelect.value;
    });
    // Html button for refreshing application list.
    let refreshButton = document.createElement("button");
    refreshButton.className = "spark-ui-refresh-applications-button"
    let buttonIcon = document.createElement("span");
    refreshIcon.element({
      container: buttonIcon,
      height: "1em",
      width: "1em"
    });
    refreshButton.appendChild(buttonIcon);
    let _this = this;
    refreshButton.addEventListener("click", function clickEvn () {
      _this.addApplicationOptions(applicationSelect, sparkUIFrame, serverSettings);
    });

    this.node.appendChild(selectLabel);
    this.node.appendChild(applicationSelect);
    this.node.appendChild(refreshButton)
    this.node.appendChild(sparkUIFrame);
    this.addApplicationOptions(applicationSelect, sparkUIFrame, serverSettings);

  }

  private addApplicationOptions(applicationSelect:HTMLSelectElement,sparkUIFrame:HTMLIFrameElement, serverSettings: ServerConnection.ISettings){
    applicationSelect.innerHTML = "";
    let contextPromise = SparkUIWidget.getRequest("spark_contexts");
    contextPromise.then(response => {
      response.json().then((ports: any) => {
        ports.forEach((port: any) => {
          let opt = document.createElement("option");
          opt.value = port[0];
          opt.text = port[1];
          applicationSelect.add(opt);
        });
        sparkUIFrame.src = URLExt.join(serverSettings.baseUrl, "sparkuitab") + "?port=" + applicationSelect.value;
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
