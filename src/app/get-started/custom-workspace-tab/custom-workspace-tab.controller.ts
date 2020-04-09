/*
 * Copyright (c) 2015-2018 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */
'use strict';

import { IChePfSelectProperties, IChePfSelectItem } from '../../../components/che-pf-widget/select/che-pf-select-typeahead.directive';
import { IChePfSwitchProperties } from '../../../components/che-pf-widget/switch/che-pf-switch.directive';
import { IChePfTextInputProperties } from '../../../components/che-pf-widget/text-input/che-pf-text-input.directive';
import { IChePfButtonProperties } from '../../../components/che-pf-widget/button/che-pf-button';
import { CheKubernetesNamespace } from '../../../components/api/che-kubernetes-namespace.factory';
import { DevfileRegistry, IDevfileMetaData } from '../../../components/api/devfile-registry.factory';
import { CheWorkspace } from '../../../components/api/workspace/che-workspace.factory';
import { CheNotification } from '../../../components/notification/che-notification.factory';

export class CustomWorkspaceTabController implements ng.IController {

  static $inject = [
    '$log',
    '$q',
    'cheKubernetesNamespace',
    'cheNotification',
    'cheWorkspace',
    'devfileRegistry',
  ];

  // used in the template
  namespaceSelect: IChePfSelectProperties;
  workspaceNameInput: IChePfTextInputProperties;
  temporaryStorageSwitch: IChePfSwitchProperties;
  devfileSelect: IChePfSelectProperties;
  devfileUrlInput: IChePfTextInputProperties;
  devfileLoadButton: IChePfButtonProperties;
  devfileLoadButtonDisabled = true;

  // injected services
  private $log: ng.ILogService;
  private $q: ng.IQService;
  private cheKubernetesNamespace: CheKubernetesNamespace;
  private cheNotification: CheNotification;
  private cheWorkspace: CheWorkspace;
  private devfileRegistry: DevfileRegistry;

  private selectedNamespace: any;

  constructor(
    $log: ng.ILogService,
    $q: ng.IQService,
    cheKubernetesNamespace: CheKubernetesNamespace,
    cheNotification: CheNotification,
    cheWorkspace: CheWorkspace,
    devfileRegistry: DevfileRegistry,
  ) {
    this.$log = $log;
    this.$q = $q;
    this.cheKubernetesNamespace = cheKubernetesNamespace;
    this.cheNotification = cheNotification;
    this.cheWorkspace = cheWorkspace;
    this.devfileRegistry = devfileRegistry;
  }

  $onInit(): void {
    this.workspaceNameInput = {
      config: {
        name: 'workspaceName',
        placeHolder: 'Enter a workspace name',
      },
      onChange: name => console.log('>>> new workspace name', name)
    };
    this.temporaryStorageSwitch = {
      config: {
        name: 'temporaryStorage',
      },
      onChange: value => console.log('>>> new temp storage value', value)
    };
    this.devfileUrlInput = {
      config: {
        name: 'devfileUrl',
        placeHolder: 'URL of devfile',
      },
      onChange: devfileUrl => {
        console.log('new devfile url', devfileUrl);
        this.devfileLoadButtonDisabled = !devfileUrl;
      },
    };
    this.devfileLoadButton = {
      title: 'Load devfile',
      onClick: () => console.log('Load url button"s clicked'),
    };

    // init namespace selector
    this.cheKubernetesNamespace.fetchKubernetesNamespace().then(namespaces => this.initNamespaceSelect(namespaces));
    // init devfile selector
    this.cheWorkspace.fetchWorkspaceSettings()
      .then(() => {
        const settings = this.cheWorkspace.getWorkspaceSettings();
        return settings && settings.cheWorkspaceDevfileRegistryUrl;
      })
      .then(devfileRegistryUrl => {
        if (!devfileRegistryUrl) {
          return this.$q.reject();
        }
        return this.devfileRegistry.fetchDevfiles(devfileRegistryUrl);
      })
      .then(devfiles => this.initDevfileSelector(devfiles))
      .catch(() => {
        const message = 'Failed to load the devfile registry URL.';
        this.cheNotification.showError(message);
        this.$log.error(message);
      });
  }

  private initNamespaceSelect(kubernetesNamespaces: che.IKubernetesNamespace[]): void {
    const infrastructureNamespaces = [];
    this.selectedNamespace = undefined;

    kubernetesNamespaces.forEach(namespace => {
      const displayName = this.getNamespaceName(namespace);
      infrastructureNamespaces.push(displayName);
      if (this.selectedNamespace === undefined || namespace.attributes.default) {
        this.selectedNamespace = displayName;
      }
    });
    infrastructureNamespaces.sort();

    this.namespaceSelect = {
      config: {
        items: infrastructureNamespaces,
        placeholder: 'Select a namespace',
        default: this.selectedNamespace,
        disabled: infrastructureNamespaces.length === 1,
      },
      onSelect: namespace => console.log('selected namespace: ', namespace)
    };
  }

  private getNamespaceName(namespace: che.IKubernetesNamespace): string {
    return namespace.attributes.displayName || namespace.name;
  }

  private initDevfileSelector(devfiles: IDevfileMetaData[]): void {
    const items: IChePfSelectItem[] = devfiles.map(devfile => devfile.displayName);

    this.devfileSelect = {
      config: {
        items,
        placeholder: 'Select a devfile template',
      },
      onSelect: devfile => console.log('selected devfile', devfile),
    };
  }

}
