import {ILabShell, JupyterFrontEnd, JupyterFrontEndPlugin} from '@jupyterlab/application';
import {ICommandPalette, MainAreaWidget,} from '@jupyterlab/apputils';
// import * as React from 'react';
import '../style/index.css';
import {ReadonlyJSONObject} from '@lumino/coreutils';
import {toArray} from '@lumino/algorithm';
import {Menu} from '@lumino/widgets'
import {IMainMenu} from '@jupyterlab/mainmenu'
import {SparkUIWidget} from "./sparkUIWidget";


/**
 * Initialization data for the spark_ui_tab extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'spark_ui_tab',
  autoStart: true,
  requires: [IMainMenu, ICommandPalette, ILabShell],
  activate

};

namespace CommandIDs {
  export const run = 'sparkui:run';
}

function activate(app:  JupyterFrontEnd, mainMenu: IMainMenu, palette: ICommandPalette, labShell: ILabShell): void {
  const {commands} = app;
  let widget: SparkUIWidget;


  commands.addCommand(CommandIDs.run, {
    label: 'Spark UI',
    execute: (args: ReadonlyJSONObject) => {
      widget = new SparkUIWidget();
      widget.title.label = 'Open Spark UI';
      let main = new MainAreaWidget({content: widget});
      // If there are any other widgets open, remove the launcher close icon.
      main.title.closable = !!toArray(labShell.widgets('main')).length;
      labShell.add(main,'main',{activate: args['activate'] as boolean});
      labShell.layoutModified.connect(
          () => {
            // If there is only a launcher open, remove the close icon.
            main.title.closable = toArray(labShell.widgets('main')).length > 1;
          },
          main
      );
      return main;
    }

  });
  palette.addItem({command: CommandIDs.run, category: 'Spark'});

  let menu = createMenu(app);
  mainMenu.addMenu(menu, {rank: 100});
}

export function createMenu(app:  JupyterFrontEnd): Menu {
  const {commands} = app;
  let menu: Menu = new Menu({commands});
  menu.title.label = 'Spark';
  menu.addItem({command: CommandIDs.run});
  return menu;
}

export default extension;
